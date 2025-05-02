import { NextResponse } from 'next/server';
import { checkAnswer } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ 
        error: 'Mistral API key is not configured. Please set the MISTRAL_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const {  answer, correctAnswer,  question = '' } = await request.json();
    
    try {
      const result = await checkAnswer(answer, correctAnswer, question);
      return NextResponse.json(result);
    } catch (error) {
      // Pass the error directly to the UI
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 400 });
  }
} 