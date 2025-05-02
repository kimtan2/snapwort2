import { NextResponse } from 'next/server';
import { getLanguageAssistance } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { word, language, queryType } = await req.json();

    if (!word || !language) {
      return NextResponse.json(
        { error: 'Word and language are required' },
        { status: 400 }
      );
    }

    try {
      // Pass queryType to getLanguageAssistance
      const result = await getLanguageAssistance(word, language, queryType);

      // Pass the model information back to the client
      return NextResponse.json({
        title: result.title,
        answer: result.answer,
        suggestions: result.suggestions,
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
    console.error('Error getting word meaning:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
