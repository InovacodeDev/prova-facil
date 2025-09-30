import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";

@Injectable()
export class AiService {
    constructor(private readonly supabase: SupabaseService) {}

    async generateAndSave(opts: {
        topic: string;
        content?: any;
        types: Array<'mcq' | 'tf' | 'dissertativa' | 'somatoria' | 'ligacao'>;
        count: number;
        userId?: string;
        category?: string;
    }) {
        // Delegate generation to SupabaseService's generator (we refactored earlier)
        // or implement similar logic here. For now call supabase.generateQuestions if available.
        // Fallback: call a simple generator in this service.
        // Note: SupabaseService currently exposes generateQuestions as private; instead
        // we will implement a lightweight local generator here and then persist results.

        const { topic, content, types, count, userId, category } = opts;
        const questions: any[] = [];
        const answers: any[] = [];

        // simple local generator (keeps same shapes as earlier)
        const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
        const parts = [1,2,4,8,16,32,64];

        for (let i = 0; i < count; i++) {
            const t = types[i % types.length];
            const id = `q_${Date.now()}_${i}`;
            if (t === 'mcq') {
                const q = `Sobre ${topic}, escolha a alternativa correta (questão ${i + 1}).`;
                const options = ['Resposta A', 'Resposta B', 'Resposta C', 'Resposta D'];
                const correctIndex = Math.floor(Math.random() * 4);
                questions.push({ id, type: t, question: q, options });
                answers.push({ id, type: t, correctIndex });
            } else if (t === 'tf') {
                const q = `V/F: Afirmação sobre ${topic}.`;
                const correct = Math.random() < 0.5 ? 'Verdadeiro' : 'Falso';
                questions.push({ id, type: t, question: q, options: ['Verdadeiro','Falso'] });
                answers.push({ id, type: t, correct });
            } else if (t === 'dissertativa') {
                const q = `Explique concisamente um conceito sobre ${topic}.`;
                const expected = `Resposta esperada: explicação concisa que inclua pontos-chave sobre ${topic}.`;
                questions.push({ id, type: t, question: q });
                answers.push({ id, type: t, expected });
            } else if (t === 'somatoria') {
                let chosen: number[] = [];
                while (chosen.length < 3) {
                    const c = pick(parts);
                    if (!chosen.includes(c)) {
                        const s = chosen.reduce((a,b)=>a+b,0)+c;
                        if (s <= 99) chosen.push(c);
                    }
                }
                const target = chosen.reduce((a,b)=>a+b,0);
                const options = [chosen.join(' + '), chosen.map(x=>x+1).join(' + '), parts.slice(0,3).join(' + '), parts.slice(1,4).join(' + ')];
                questions.push({ id, type: t, question: `Escolha a combinação que soma ${target}`, options });
                answers.push({ id, type: t, correct: options[0] });
            } else if (t === 'ligacao') {
                const left = [`${topic} A${i}`, `${topic} B${i}`, `${topic} C${i}`];
                const right = ['Grupo 1','Grupo 2','Grupo 3'];
                const mapping: Record<string,string> = {};
                left.forEach((l,idx)=>mapping[l]=right[idx%right.length]);
                questions.push({ id, type: t, question: `Relacione itens sobre ${topic}`, left, right });
                answers.push({ id, type: t, mapping });
            }
        }

        // persist questions and answers to DB via Supabase
        const supa = this.supabase.client();

        // Ensure category exists or create
        let categoryId: string | null = null;
        if (category) {
            // try to find existing category
            const { data: existing, error: findErr } = await supa.from('categories').select('*').eq('name', category).single();
            if (findErr || !existing) {
                const { data: created, error: createErr } = await supa.from('categories').insert({ name: category }).select().single();
                if (createErr) throw new HttpException({ error: createErr.message }, HttpStatus.INTERNAL_SERVER_ERROR);
                categoryId = created.id;
            } else {
                categoryId = existing.id;
            }
        }

        // insert each question and its answer
        const insertedQuestions: any[] = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const a = answers[i];
            const payload = {
                user_id: opts.userId || null,
                category_id: categoryId,
                type: q.type,
                question: q.question,
                meta: q.options ? { options: q.options, left: q.left, right: q.right } : undefined,
                created_at: new Date().toISOString(),
            };
            const { data: qdata, error: qerr } = await supa.from('questions').insert(payload).select().single();
            if (qerr) throw new HttpException({ error: qerr.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            // save answer linked to question
            const answerPayload = { question_id: qdata.id, answer: a, created_at: new Date().toISOString() };
            const { data: adata, error: aerr } = await supa.from('answers').insert(answerPayload).select().single();
            if (aerr) throw new HttpException({ error: aerr.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            insertedQuestions.push({ question: qdata, answer: adata });
        }

        return { inserted: insertedQuestions };
    }
}
