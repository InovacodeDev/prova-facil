import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    generateMcqQuestions,
    generateTfQuestions,
    generateDissertativeQuestions,
    generateSumQuestions,
    generateFillInTheBlankQuestions,
    generateMatchingColumnsQuestions,
    generateProblemSolvingQuestions,
    generateEssayQuestions,
    generateProjectBasedQuestions,
    generateGamifiedQuestions,
    generateSummativeQuestions,
    GenerateQuestionsInput,
} from "@/lib/genkit/prompts";
import { QuestionType } from "@/db/schema";
import { checkUserQuota, updateProfileLogsCycle } from "@/lib/usage-tracking";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 segundos para chamadas de IA

interface DocumentMetadata {
    fileName: string;
    fileType: string;
    wordCount: number;
    pageCount?: number;
}

interface GenerateQuestionsRequest {
    title: string;
    questionCount: number;
    subject: string;
    subjectId: string;
    questionTypes: Array<keyof typeof QuestionType>;
    questionContext: string;
    academicLevel?: string;
    documentContent?: string; // Texto extraído de DOCX
    pdfFiles?: Array<{ name: string; type: string; data: string }>; // PDFs completos (plus/advanced)
    documentMetadata?: DocumentMetadata[];
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Buscar profile e plano do usuário
        const { data: profile } = await supabase.from("profiles").select("id, plan").eq("user_id", user.id).single();

        if (!profile) {
            return NextResponse.json({ error: "Profile não encontrado" }, { status: 404 });
        }

        // Buscar modelo de IA configurado para o plano do usuário
        const { data: planModelData } = await supabase
            .from("plan_models")
            .select("model")
            .eq("plan", profile.plan)
            .single();

        const aiModel = planModelData?.model || "gemini-2.0-flash";

        // 2. Parse do body
        const body: GenerateQuestionsRequest = await request.json();
        const {
            title,
            questionCount: requestedQuestionCount,
            subject,
            questionTypes,
            questionContext,
            academicLevel,
            documentContent,
            pdfFiles,
        } = body;

        const normalizedQuestionCount = Number(requestedQuestionCount);

        if (!Number.isFinite(normalizedQuestionCount) || normalizedQuestionCount <= 0) {
            return NextResponse.json({ error: "Quantidade de questões inválida" }, { status: 400 });
        }

        const totalRequestedQuestions = Math.max(1, Math.floor(normalizedQuestionCount));

        // Validações
        console.log(body);
        if (!title || !subject || !questionTypes || questionTypes.length === 0 || !questionContext) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }

        const hasQuota = await checkUserQuota(profile.id, totalRequestedQuestions);

        if (!hasQuota) {
            return NextResponse.json(
                {
                    error: "Você atingiu o limite mensal de geração de questões do seu plano. Aguarde o próximo ciclo ou faça upgrade.",
                },
                { status: 403 }
            );
        }

        // 3. Criar o assessment
        const { data: assessment, error: assessmentError } = await supabase
            .from("assessments")
            .insert({
                user_id: profile.id,
                title: title,
                subject,
            })
            .select()
            .single();

        if (assessmentError || !assessment) {
            console.error("Erro ao criar assessment:", assessmentError);
            return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 });
        }

        // 4. Distribuir questões pelos tipos
        const questionsPerType = Math.floor(totalRequestedQuestions / questionTypes.length);
        const remainder = totalRequestedQuestions % questionTypes.length;

        const allGeneratedQuestions: {}[] = [];

        // 5. Gerar questões para cada tipo
        for (let i = 0; i < questionTypes.length; i++) {
            const type = questionTypes[i];
            const count = questionsPerType + (i < remainder ? 1 : 0);

            if (count === 0) continue;

            const input: GenerateQuestionsInput = {
                subject,
                count,
                questionContext,
                academicLevel,
                documentContent, // Texto de DOCX
                pdfFiles, // PDFs completos (plus/advanced)
                aiModel, // Modelo de IA configurado por plano
            };

            try {
                let result;

                switch (type) {
                    case "multiple_choice":
                        result = await generateMcqQuestions(input);
                        break;
                    case "true_false":
                        result = await generateTfQuestions(input);
                        break;
                    case "open":
                        result = await generateDissertativeQuestions(input);
                        break;
                    case "sum":
                        result = await generateSumQuestions(input);
                        break;
                    case "fill_in_the_blank":
                        result = await generateFillInTheBlankQuestions(input);
                        break;
                    case "matching_columns":
                        result = await generateMatchingColumnsQuestions(input);
                        break;
                    case "problem_solving":
                        result = await generateProblemSolvingQuestions(input);
                        break;
                    case "essay":
                        result = await generateEssayQuestions(input);
                        break;
                    case "project_based":
                        result = await generateProjectBasedQuestions(input);
                        break;
                    case "gamified":
                        result = await generateGamifiedQuestions(input);
                        break;
                    case "summative":
                        result = await generateSummativeQuestions(input);
                        break;
                    default:
                        console.warn(`Tipo de questão não suportado: ${type}`);
                        continue;
                }

                if (result?.questions) {
                    allGeneratedQuestions.push(...result.questions);
                }
            } catch (aiError) {
                console.error(`Erro ao gerar questões do tipo ${type}:`, aiError);
                // Continua com outros tipos mesmo se um falhar
            }
        }

        if (allGeneratedQuestions.length === 0) {
            // Deletar assessment se nenhuma questão foi gerada
            await supabase.from("assessments").delete().eq("id", assessment.id);

            return NextResponse.json({ error: "Não foi possível gerar questões" }, { status: 500 });
        }

        // 7. Inserir questões e respostas/metadata no banco
        for (const genQuestion of allGeneratedQuestions) {
            // Preparar dados da questão
            const questionData: any = {
                assessment_id: assessment.id,
                type: genQuestion.question?.type || genQuestion.type,
                question: genQuestion.question?.question || genQuestion.text || "Questão sem texto",
            };

            // Se houver metadata, adiciona ao campo metadata
            if (genQuestion.question?.metadata) {
                questionData.metadata = genQuestion.question.metadata;
            }

            // Inserir questão
            const { data: insertedQuestion, error: questionError } = await supabase
                .from("questions")
                .insert(questionData)
                .select()
                .single();

            if (questionError || !insertedQuestion) {
                console.error("Erro ao inserir questão:", questionError);
                continue;
            }

            // Inserir respostas (apenas para tipos que ainda usam tabela answers como fallback)
            if (genQuestion.answers && Array.isArray(genQuestion.answers) && genQuestion.answers.length > 0) {
                const answersToInsert = genQuestion.answers.map((answer: any) => ({
                    question_id: insertedQuestion.id,
                    answer: answer.answer || answer.text || "",
                    is_correct: answer.is_correct || false,
                    number: answer.number || null,
                }));

                const { error: answersError } = await supabase.from("answers").insert(answersToInsert);

                if (answersError) {
                    console.error("Erro ao inserir respostas:", answersError);
                }
            }
        }

        if (allGeneratedQuestions.length > 0) {
            await updateProfileLogsCycle(profile.id, subject.trim() || "Geral", allGeneratedQuestions.length);
        }

        // 8. Retornar sucesso
        // NOTA: Os logs são atualizados automaticamente via triggers SQL:
        // - create_new_questions: trigger no INSERT de assessments
        // - new_questions: trigger no INSERT de questions
        return NextResponse.json({
            success: true,
            assessment_id: assessment.id,
            questions_generated: allGeneratedQuestions.length,
        });
    } catch (error: any) {
        console.error("Erro no endpoint de geração:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
    }
}
