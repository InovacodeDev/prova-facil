import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { getAdminSupabaseClient } from "../../supabase/client";
// Use the concrete return type of the client factory to avoid importing @supabase/supabase-js here
type SupabaseClientType = ReturnType<typeof getAdminSupabaseClient>;
import { z } from "zod";

function getSupabaseAdmin(): SupabaseClientType {
    try {
        return getAdminSupabaseClient();
    } catch (e: any) {
        throw new HttpException(
            { error: 'Supabase configuration error', message: e?.message || 'Missing Supabase configuration' },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().optional(),
});
const SigninSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const ChangePasswordSchema = z.object({ newPassword: z.string().min(8) });
const CreateAssessmentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.any().optional(),
    category: z.string().optional(), // subject/tag name (matéria)
    files: z
        .array(
            z.object({
                name: z.string(),
                size: z.number().int().min(0),
                mime: z.string(),
                data: z.string().optional(), // base64 (no data: prefix) - optional because we don't store PDFs
            })
        )
        .optional(),
    questionTypes: z
        .array(z.enum(['mcq', 'tf', 'dissertativa', 'somatoria', 'ligacao']))
        .optional(),
    count: z.number().int().min(1).max(100).optional(),
});
const UpdateProfileSchema = z
    .object({
        full_name: z.string().optional(),
        avatar_url: z.string().url().optional(),
        plan: z.enum(['starter','basic','essentials','plus','advanced']).optional(),
        plan_expire_at: z.string().optional(),
    })
    .passthrough();
const RpcQuerySchema = z.object({
    table: z.string(),
    select: z.string().optional(),
    filter: z.record(z.any()).optional(),
    action: z.enum(["select", "delete"]).optional(),
    order: z.object({ by: z.string(), direction: z.enum(["asc", "desc"]).optional() }).optional(),
});

@Injectable()
export class SupabaseService {
    public client(): SupabaseClientType {
        return getSupabaseAdmin();
    }

    private getPlanLimits(plan: string | null) {
        switch ((plan || 'starter').toLowerCase()) {
            case 'starter':
                return { types: ['mcq'], limit: 20 };
            case 'basic':
                return { types: ['mcq', 'dissertativa'], limit: 50 };
            case 'essentials':
                return { types: ['mcq', 'tf', 'dissertativa', 'ligacao'], limit: 100 };
            case 'plus':
                return { types: ['mcq', 'tf', 'dissertativa', 'somatoria', 'ligacao'], limit: 300 };
            case 'advanced':
                return { types: ['mcq', 'tf', 'dissertativa', 'somatoria', 'ligacao'], limit: 300 };
            default:
                return { types: ['mcq'], limit: 20 };
        }
    }
    async signup(body: unknown): Promise<any> {
        const parse = SignupSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { email, password, full_name } = parse.data;

        try {
            const { data: user, error } = await getSupabaseAdmin().auth.admin.createUser({
                email,
                password,
                email_confirm: false,
                user_metadata: { full_name },
            });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            try {
                await getSupabaseAdmin()
                    .from("profiles")
                    .insert({ id: (user as any).id, full_name, email });
            } catch (e) {
                console.warn("profile insert failed", e);
            }
            return { user };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "signup failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async signin(body: unknown): Promise<any> {
        const parse = SigninSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { email, password } = parse.data;
        try {
            const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({ email, password });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.UNAUTHORIZED);
            return data;
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "signin failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async changePassword(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = ChangePasswordSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { newPassword } = parse.data;
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            const { error } = await getSupabaseAdmin().auth.admin.updateUserById((user as any).id, {
                password: newPassword,
            });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { ok: true };
        } catch (e: any) {
            console.error(e);
            throw new HttpException(
                { error: e?.message || "change password failed" },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async me(token: string | null): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        try {
            const {
                data: { user },
                error,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (error || !user)
                throw new HttpException({ error: error?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            return { user };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "me failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createAssessment(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = CreateAssessmentSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const payload = parse.data;
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            // Persist assessment metadata, handle category, files, generate questions and persist
            const userId = (user as any).id;
            const types = payload.questionTypes ?? ['mcq', 'tf', 'dissertativa', 'somatoria', 'ligacao'];
            const count = payload.count ?? Math.min(10, Math.max(1, 5));
            const topic = (payload.title && String(payload.title)) || (payload.content && String(payload.content)) || 'assunto geral';

            // 1) Ensure category exists (if provided)
            let categoryId: string | null = null;
            if (payload.category && String(payload.category).trim() !== '') {
                const catName = String(payload.category).trim();
                // try find
                const { data: existingCats } = await getSupabaseAdmin().from('categories').select('id').eq('name', catName).limit(1);
                if (existingCats && existingCats.length > 0) {
                    categoryId = existingCats[0].id;
                } else {
                    const { data: insertedCat, error: catErr } = await getSupabaseAdmin()
                        .from('categories')
                        .insert({ name: catName })
                        .select()
                        .limit(1);
                    if (catErr) console.warn('category insert failed', catErr.message);
                    if (insertedCat && insertedCat[0]) categoryId = insertedCat[0].id;
                }
            }

            // --- Plan enforcement: fetch user's profile plan and ensure limits ---

            // fetch user profile to get plan
            let userPlan = 'starter';
            try {
                const { data: profileRows } = await getSupabaseAdmin().from('profiles').select('plan, plan_expire_at').eq('user_id', userId).limit(1);
                if (Array.isArray(profileRows) && profileRows[0]) {
                    userPlan = profileRows[0].plan || 'starter';
                }
            } catch (e) {
                // ignore and assume starter
            }

            const { types: allowedTypes, limit: monthlyLimit } = this.getPlanLimits(userPlan);

            // ensure requested question types are within allowed set
            const disallowed = (types || []).filter((t) => !allowedTypes.includes(t));
            if (disallowed.length > 0) {
                throw new HttpException({ error: `Plan '${userPlan}' does not allow question types: ${disallowed.join(', ')}` }, HttpStatus.FORBIDDEN);
            }

            // compute how many questions user already generated this month for this subject (category)
            let existingCountForSubject = 0;
            try {
                if (categoryId) {
                    const startOfMonth = new Date();
                    startOfMonth.setUTCDate(1);
                    startOfMonth.setUTCHours(0, 0, 0, 0);
                    const { data: qRows } = await getSupabaseAdmin()
                        .from('questions')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('category_id', categoryId)
                        .gte('created_at', startOfMonth.toISOString());
                    existingCountForSubject = Array.isArray(qRows) ? qRows.length : 0;
                }
            } catch (e) {
                console.warn('failed to fetch existing monthly counts for subject', e);
            }

            if (categoryId) {
                if (existingCountForSubject + count > monthlyLimit) {
                    throw new HttpException({ error: `Plan '${userPlan}' allows maximum ${monthlyLimit} questions per subject per month.` }, HttpStatus.FORBIDDEN);
                }
            }

            // 2) Create assessment record
            const { data: assessmentRows, error: assessmentErr } = await getSupabaseAdmin()
                .from('assessments')
                .insert({ user_id: userId, title: payload.title ?? 'Untitled', description: payload.description ?? null })
                .select()
                .limit(1);
            if (assessmentErr) throw new HttpException({ error: assessmentErr.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            const assessmentId = assessmentRows && assessmentRows[0] ? assessmentRows[0].id : null;

            // 3) Handle files: validate sizes but DO NOT upload to storage.
            // We will persist only lightweight metadata for each file (name/size/mime)
            // to avoid storing heavy PDF blobs in Supabase Storage.
            const MAX_PER_FILE = 5 * 1024 * 1024;
            const MAX_TOTAL = 50 * 1024 * 1024;
            let totalSize = 0;
            if (Array.isArray(payload.files) && payload.files.length > 0) {
                for (const f of payload.files) totalSize += Number(f.size || 0);
                if (payload.files.some((f: any) => Number(f.size || 0) > MAX_PER_FILE)) {
                    throw new HttpException({ error: 'one or more files exceed 5MB limit' }, HttpStatus.BAD_REQUEST);
                }
                if (totalSize > MAX_TOTAL) {
                    throw new HttpException({ error: 'total uploaded files exceed 50MB limit' }, HttpStatus.BAD_REQUEST);
                }

                for (const f of payload.files) {
                    try {
                        // IMPORTANT: do NOT upload the PDF to storage. Persist only metadata so
                        // the UI and future operations know a file was attached without keeping
                        // the full PDF in the database/storage.
                        await getSupabaseAdmin().from('questions').insert({
                            user_id: userId,
                            assessment_id: assessmentId,
                            title: `Arquivo: ${f.name}`,
                            type: 'attachment',
                            question: `Arquivo enviado: ${f.name}`,
                            meta: { filename: f.name, size: Number(f.size || 0), mime: f.mime },
                        });
                    } catch (e) {
                        console.warn('failed to insert file metadata into questions', e?.message || e);
                    }
                }
            }

            // 4) Generate questions using existing generator
            const result = await this.generateQuestions({ topic, content: payload.content, types, count, userId });

            // 5) Persist generated questions and answers linking to assessment
            try {
                for (const q of result.questions || []) {
                    const { data: insertedQ, error: qErr } = await getSupabaseAdmin()
                        .from('questions')
                        .insert({
                            user_id: userId,
                            assessment_id: assessmentId,
                            category_id: categoryId,
                            title: payload.title ?? null,
                            type: q.type || 'mcq',
                            question: q.question || q.text || '',
                            meta: q.options ? { options: q.options } : {},
                        })
                        .select()
                        .limit(1);
                    if (qErr) {
                        console.warn('failed to insert question', qErr.message);
                        continue;
                    }
                    const qId = insertedQ && insertedQ[0] ? insertedQ[0].id : null;
                    const correspondingAnswer = (result.answers || []).find((a: any) => a.id === q.id);
                    if (qId && correspondingAnswer) {
                        try {
                            await getSupabaseAdmin().from('answers').insert({
                                question_id: qId,
                                answer: correspondingAnswer,
                                is_correct: typeof correspondingAnswer.correctIndex !== 'undefined' || typeof correspondingAnswer.correct !== 'undefined',
                            });
                        } catch (ae) {
                            console.warn('failed to insert answer', ae);
                        }
                    }
                }
            } catch (e) {
                console.warn('persisting generated questions failed', e?.message || e);
            }

            return { questions: result.questions, answers: result.answers, assessmentId };
        } catch (e: any) {
            console.error(e);
            throw new HttpException(
                { error: e?.message || "create assessment failed" },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

private async generateQuestions(opts: {
    topic: string;
    content?: any;
    types: Array<'mcq' | 'tf' | 'dissertativa' | 'somatoria' | 'ligacao'>;
    count: number;
    userId?: string;
}): Promise<{ questions: any[]; answers: any[] }> {
    const { topic, content, types, count } = opts;

    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    if (openaiKey) {
        try {
            const system = `You are an exam question generator.`;
            const prompt = `Topic: ${topic}\nTypes: ${types.join(', ')}\nCount: ${count}\nRespond with JSON: { "questions": [...], "answers": [...] }`;
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
                body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 1200, temperature: 0.8 }),
            });
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) {
                const jsonStart = text.indexOf('{');
                const jsonStr = jsonStart >= 0 ? text.slice(jsonStart) : text;
                try {
                    const parsed = JSON.parse(jsonStr);
                    return { questions: parsed.questions || [], answers: parsed.answers || [] };
                } catch (parseErr) {
                    console.warn('OpenAI returned non-JSON, falling back', parseErr);
                }
            }
        } catch (err) {
            console.warn('OpenAI call failed, falling back to local generator', err?.message || err);
        }
    }

    // local fallback
    const questions: any[] = [];
    const answers: any[] = [];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    for (let i = 0; i < count; i++) {
        const t = types[i % types.length];
        const id = `q${Date.now()}_${i}`;
        if (t === 'mcq') {
            const q = `Sobre ${topic}, escolha a alternativa correta (questão ${i + 1}).`;
            const options = ['Resposta A', 'Resposta B', 'Resposta C', 'Resposta D'];
            const correctIndex = Math.floor(Math.random() * 4);
            questions.push({ id, type: 'mcq', question: q, options });
            answers.push({ id, type: 'mcq', correctIndex });
        } else if (t === 'tf') {
            const q = `Verdadeiro ou falso: afirmação relacionada a ${topic}.`;
            const correct = Math.random() < 0.5 ? 'Verdadeiro' : 'Falso';
            questions.push({ id, type: 'tf', question: q, options: ['Verdadeiro', 'Falso'] });
            answers.push({ id, type: 'tf', correct });
        } else if (t === 'dissertativa') {
            const q = `Explique de forma concisa um conceito importante sobre ${topic}.`;
            const expected = `Resposta esperada: explicação concisa que inclua conceitos principais sobre ${topic}. Aceitam-se variações.`;
            questions.push({ id, type: 'dissertativa', question: q });
            answers.push({ id, type: 'dissertativa', expected });
        } else if (t === 'somatoria') {
            const parts = [1, 2, 4, 8, 16, 32, 64];
            let chosen: number[] = [];
            while (chosen.length < 3) {
                const c = pick(parts);
                if (!chosen.includes(c)) {
                    const s = chosen.reduce((a, b) => a + b, 0) + c;
                    if (s <= 99) chosen.push(c);
                }
            }
            const target = chosen.reduce((a, b) => a + b, 0);
            const options = [chosen.join(' + '), chosen.map(x => x + 1).join(' + '), parts.slice(0,3).join(' + '), parts.slice(1,4).join(' + ')];
            questions.push({ id, type: 'somatoria', question: `Escolha a combinação que soma ${target}`, options });
            answers.push({ id, type: 'somatoria', correct: options[0] });
        } else if (t === 'ligacao') {
            const left = [`${topic} A${i}`, `${topic} B${i}`, `${topic} C${i}`];
            const right = ['Grupo 1', 'Grupo 2', 'Grupo 3'];
            const mapping: Record<string, string> = {};
            left.forEach((l, idx) => mapping[l] = right[idx % right.length]);
            questions.push({ id, type: 'ligacao', question: `Relacione os itens da esquerda com os da direita sobre ${topic}`, left, right });
            answers.push({ id, type: 'ligacao', mapping });
        }
    }

    return { questions, answers };
}

    async updateProfile(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = UpdateProfileSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            const updates = { ...parse.data, updated_at: new Date().toISOString() };
            const { data, error } = await getSupabaseAdmin()
                .from("profiles")
                .update(updates)
                .eq("id", (user as any).id)
                .select();
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { data };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "profile update failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rpcQuery(body: unknown, token: string | null = null): Promise<any> {
        const parse = RpcQuerySchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { table, select, filter, action, order } = parse.data;
        try {
            if (action === "delete") {
                if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
                const {
                    data: { user },
                    error: userErr,
                } = await getSupabaseAdmin().auth.getUser(token);
                if (userErr || !user)
                    throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
                if (!filter || typeof filter !== "object")
                    throw new HttpException({ error: "filter required for delete" }, HttpStatus.BAD_REQUEST);
                const match = { ...filter } as Record<string, any>;
                if (!Object.prototype.hasOwnProperty.call(match, "user_id")) match.user_id = (user as any).id;
                const { data, error } = await getSupabaseAdmin().from(table).delete().match(match).select();
                if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
                return { data };
            }

            // special-case: support `select: 'distinct <column>'` as a convenience
            // clients may pass `distinct title` or similar. Supabase's client does not
            // accept `distinct title` as a column name, so detect and perform a distinct
            // projection server-side here.
            let q: any;
            const selectStr: string | undefined = select;
            const distinctMatch = typeof selectStr === 'string' && selectStr.trim().toLowerCase().startsWith('distinct ');
            if (distinctMatch) {
                // extract the column name after 'distinct '
                const col = selectStr.trim().slice('distinct '.length).trim();
                // build a query that selects only that column
                q = getSupabaseAdmin().from(table).select(col);
                if (filter && typeof filter === 'object') Object.entries(filter).forEach(([k, v]) => (q = q.eq(k, v)));
                if (order && typeof order === 'object' && order.by)
                    q = q.order(order.by, { ascending: (order.direction || 'asc').toLowerCase() !== 'desc' });
                const { data, error } = await q;
                if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
                // dedupe values and return an array of objects with the column key
                const values = Array.isArray(data) ? Array.from(new Set(data.map((r: any) => r && r[col]).filter(Boolean))) : [];
                return { data: values.map((v: any) => ({ [col]: v })) };
            }

            q = getSupabaseAdmin().from(table).select(select || "*");
            if (filter && typeof filter === "object") Object.entries(filter).forEach(([k, v]) => (q = q.eq(k, v)));
            if (order && typeof order === "object" && order.by)
                q = q.order(order.by, { ascending: (order.direction || "asc").toLowerCase() !== "desc" });

            // Execute the query and handle the case where the client asked for columns
            // that don't exist in the target table (e.g. optional columns like `plan`).
            // Instead of propagating a 500, return an empty data set so callers can
            // gracefully handle the absence of those columns.
            try {
                const { data, error } = await q;
                if (error) throw error;
                return { data };
            } catch (queryErr: any) {
                const msg = queryErr?.message || String(queryErr);
                // PostgREST / Postgres error for missing column typically contains "does not exist"
                if (typeof msg === 'string' && msg.includes('does not exist')) {
                    // Log at debug level and return empty array to avoid breaking callers
                    console.debug('rpcQuery: requested column does not exist on table', table, msg);
                    return { data: [] };
                }
                // rethrow as HttpException so outer catch still logs appropriately
                throw new HttpException({ error: msg }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "query failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getMonthlyUsage(token: string | null, category?: string | undefined): Promise<any> {
        if (!token) throw new HttpException({ error: 'missing token' }, HttpStatus.UNAUTHORIZED);
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user) throw new HttpException({ error: userErr?.message || 'invalid token' }, HttpStatus.UNAUTHORIZED);
            const userId = (user as any).id;

            const startOfMonth = new Date();
            startOfMonth.setUTCDate(1);
            startOfMonth.setUTCHours(0, 0, 0, 0);

            if (category) {
                // find category id
                const { data: catRows } = await getSupabaseAdmin().from('categories').select('id').eq('name', String(category)).limit(1);
                const catId = Array.isArray(catRows) && catRows[0] ? catRows[0].id : null;
                if (!catId) return { data: { [category]: 0 } };
                const { data: qRows } = await getSupabaseAdmin()
                    .from('questions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('category_id', catId)
                    .gte('created_at', startOfMonth.toISOString());
                const count = Array.isArray(qRows) ? qRows.length : 0;
                return { data: { [category]: count } };
            }

            // return map of category name -> count for categories where user has questions this month
            const { data: qRows } = await getSupabaseAdmin()
                .from('questions')
                .select('category_id')
                .eq('user_id', userId)
                .gte('created_at', startOfMonth.toISOString());
            const catCounts: Record<string, number> = {};
            if (Array.isArray(qRows)) {
                const catIds = Array.from(new Set(qRows.map((r: any) => r.category_id).filter(Boolean)));
                if (catIds.length === 0) return { data: {} };
                // fetch names for these categories
                const { data: cats } = await getSupabaseAdmin().from('categories').select('id,name').in('id', catIds);
                const nameById: Record<string, string> = {};
                if (Array.isArray(cats)) cats.forEach((c: any) => (nameById[c.id] = c.name));
                // count per category id
                for (const r of qRows) {
                    const cid = r.category_id;
                    if (!cid) continue;
                    const name = nameById[cid] || cid;
                    catCounts[name] = (catCounts[name] || 0) + 1;
                }
            }
            return { data: catCounts };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || 'usage query failed' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUsageWithLimits(token: string | null, category?: string | undefined): Promise<any> {
        if (!token) throw new HttpException({ error: 'missing token' }, HttpStatus.UNAUTHORIZED);
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user) throw new HttpException({ error: userErr?.message || 'invalid token' }, HttpStatus.UNAUTHORIZED);
            const userId = (user as any).id;

            // fetch profile plan
            let userPlan = 'starter';
            try {
                const { data: profileRows } = await getSupabaseAdmin().from('profiles').select('plan, plan_expire_at').eq('user_id', userId).limit(1);
                if (Array.isArray(profileRows) && profileRows[0]) userPlan = profileRows[0].plan || 'starter';
            } catch (e) {
                // ignore and default to starter
            }

            const { types: allowedTypes, limit: monthlyLimit } = this.getPlanLimits(userPlan);

            // get usage for category or all categories
            const usageRes = await this.getMonthlyUsage(token, category);

            // usageRes.data could be { categoryName: count } or { cat1: cnt, ... }
            const usage = usageRes && usageRes.data ? usageRes.data : {};

            // If a single category was requested, return numeric used + remaining
            if (category) {
                const used = Number(usage[category] || 0);
                const remaining = Math.max(0, monthlyLimit - used);
                return {
                    data: {
                        plan: userPlan,
                        allowedTypes,
                        monthlyLimit,
                        used,
                        remaining,
                    },
                };
            }

            // For all categories, map each to remaining
            const perCategory: Record<string, { used: number; remaining: number }> = {};
            for (const [cat, cnt] of Object.entries(usage)) {
                const used = Number(cnt || 0);
                perCategory[cat] = { used, remaining: Math.max(0, monthlyLimit - used) };
            }

            return {
                data: {
                    plan: userPlan,
                    allowedTypes,
                    monthlyLimit,
                    perCategory,
                },
            };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || 'usage with limits failed' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
