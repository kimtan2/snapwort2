import { NextResponse } from 'next/server';
import { getFollowUp } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { question, language, previousContext } = await req.json();

    if (!question || !language) {
      return NextResponse.json(
        { error: 'Question and language are required' },
        { status: 400 }
      );
    }

    try {
      // Always use the DEFAULT_MODEL_PROVIDER configuration from lib/openai.ts
      const result = await getFollowUp(question, language, previousContext);

      return NextResponse.json({ 
        answer: result.answer,
        modelUsed: result.modelUsed
      });
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      return NextResponse.json(
        { error: 'The language model failed to respond. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing follow-up question:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
} 