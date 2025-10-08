import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
  GenerateQuestionsOutput,
} from '@/lib/genkit/prompts';
import { QuestionType } from '@/db/schema';
import { checkUserQuota, updateProfileLogsCycle } from '@/lib/usage-tracking';
import { logError } from '@/lib/error-logs-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60-second timeout for AI calls
export const dynamic = 'force-dynamic'; // Necessário pois usa cookies via logError

interface GenerateQuestionsRequest {
  title: string;
  questionCount: number;
  subject: string;
  questionTypes: Array<keyof typeof QuestionType>;
  questionContext: string;
  academicLevel?: string;
  documentContent?: string;
  pdfFiles?: Array<{ name: string; type: string; data: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user and get profile
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('id, plan').eq('user_id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Get AI model for user's plan
    const { data: planModelData } = await supabase
      .from('plan_models')
      .select('model')
      .eq('plan', profile.plan)
      .single();
    const aiModel = planModelData?.model || 'gemini-2.5-flash-lite';

    // 3. Parse and validate request body
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

    const totalRequestedQuestions = Math.max(1, Math.floor(Number(requestedQuestionCount) || 0));
    if (
      totalRequestedQuestions === 0 ||
      !title ||
      !subject ||
      !questionTypes ||
      questionTypes.length === 0 ||
      !questionContext
    ) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // 4. Check user's quota
    const hasQuota = await checkUserQuota(profile.id, totalRequestedQuestions);
    if (!hasQuota) {
      return NextResponse.json(
        {
          error:
            'You have reached your monthly question generation limit. Please upgrade your plan or wait for the next cycle.',
        },
        { status: 403 }
      );
    }

    // 5. Create or find the assessment
    let { data: assessment } = await supabase.from('assessments').select('id').eq('title', title).single();
    if (!assessment) {
      const { data: newAssessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({ user_id: profile.id, title, subject })
        .select('id')
        .single();

      if (assessmentError || !newAssessment) {
        console.error('Error creating assessment:', assessmentError);
        return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
      }
      assessment = newAssessment;
    }

    // 6. Distribute the number of questions to generate for each type
    const typeCount = questionTypes.length;
    const distribution: Record<string, number> = {};
    const questionsAfterMinimum = totalRequestedQuestions - typeCount;
    const extraPerType = Math.max(0, Math.floor(questionsAfterMinimum / typeCount));
    const remainder = Math.max(0, questionsAfterMinimum % typeCount);

    questionTypes.forEach((type, index) => {
      distribution[type] = (totalRequestedQuestions < typeCount ? 1 : 1 + extraPerType) + (index < remainder ? 1 : 0);
    });

    if (totalRequestedQuestions < typeCount) {
      console.warn(
        `Requested questions (${totalRequestedQuestions}) is less than selected types (${typeCount}). Adjusting to ${typeCount} total questions.`
      );
    }

    console.log('📊 Question distribution by type:', distribution);

    // 7. Generate questions in parallel
    const generationPromises = questionTypes.map(async (type) => {
      const count = distribution[type];
      if (!count) return null;

      const input: GenerateQuestionsInput = {
        subject,
        count,
        questionContext,
        academicLevel,
        documentContent,
        pdfFiles,
        aiModel,
      };

      try {
        switch (type) {
          case 'multiple_choice':
            return await generateMcqQuestions(input);
          case 'true_false':
            return await generateTfQuestions(input);
          case 'open':
            return await generateDissertativeQuestions(input);
          case 'sum':
            return await generateSumQuestions(input);
          case 'fill_in_the_blank':
            return await generateFillInTheBlankQuestions(input);
          case 'matching_columns':
            return await generateMatchingColumnsQuestions(input);
          case 'problem_solving':
            return await generateProblemSolvingQuestions(input);
          case 'essay':
            return await generateEssayQuestions(input);
          case 'project_based':
            return await generateProjectBasedQuestions(input);
          case 'gamified':
            return await generateGamifiedQuestions(input);
          case 'summative':
            return await generateSummativeQuestions(input);
          default:
            console.warn(`Unsupported question type: ${type}`);
            return null;
        }
      } catch (aiError) {
        console.error(`Failed to generate questions of type ${type}:`, aiError);
        return null; // Return null on failure to avoid breaking Promise.all
      }
    });

    const results = await Promise.all(generationPromises);
    const allGeneratedQuestions = results.flatMap((result) => result?.questions || []);

    if (allGeneratedQuestions.length === 0) {
      await supabase.from('assessments').delete().eq('id', assessment.id);
      return NextResponse.json({ error: 'Failed to generate any questions.' }, { status: 500 });
    }

    // 8. Insert validated questions into the database
    // Data is pre-validated by Zod schemas in the Genkit layer. No further sanitization needed.
    const questionsToInsert = allGeneratedQuestions.map((q) => ({
      assessment_id: assessment!.id,
      type: q.type,
      question: q.question,
      metadata: q.metadata as any, // Cast to 'any' for Supabase client, which expects generic Json
    }));

    const { error: insertError } = await supabase.from('questions').insert(questionsToInsert);
    if (insertError) {
      console.error('Database insertion error:', insertError);
      return NextResponse.json({ error: 'Failed to save generated questions.' }, { status: 500 });
    }

    // 9. Update usage logs and return success
    await updateProfileLogsCycle(profile.id, subject.trim() || 'General', allGeneratedQuestions.length);

    return NextResponse.json({
      success: true,
      assessment_id: assessment.id,
      questions_generated: allGeneratedQuestions.length,
    });
  } catch (error: any) {
    console.error('Unhandled error in generate-questions endpoint:', error);

    await logError({
      message: error instanceof Error ? error.message : 'Unknown error in generate-questions',
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      context: {
        endpoint: '/api/generate-questions',
        method: 'POST',
      },
    });

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
