import { NextResponse } from 'next/server';
import { generateTasks } from '@/lib/mistral';

export async function POST(request: Request) {
  try {
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ 
        error: 'Mistral API key is not configured. Please set the MISTRAL_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { count = 1, previousTasks = [], language = 'en' } = await request.json();
    console.log(`API generate-tasks called with language: ${language}, count: ${count}`);
    
    try {
      // Generate tasks using the Mistral API
      console.log(`Calling mistral.generateTasks with language: ${language}`);
      const tasks = await generateTasks(count, previousTasks, language);
      
      if (!tasks || !Array.isArray(tasks)) {
        console.error('Invalid response format from Mistral API:', tasks);
        throw new Error('Invalid response format from Mistral API');
      }

      console.log(`Successfully generated ${tasks.length} tasks`);
      return NextResponse.json(tasks);
    } catch (error) {
      // Pass the error directly to the UI
      console.error(`Error generating tasks for language ${language}:`, error);
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