import { NextResponse } from 'next/server';

interface WordTask {
  language: string;
  question: string;
  meantWord: string;
  alternativeWords: string[];
  example: string;
}

interface Task {
  id: string;
  type: 'free_response';
  question: string;
  answer: string;
  alternativeWords: string[];
  example: string;
  points: number;
  isCustom: boolean;
}

// Function to extract JSON from markdown code blocks if needed
function extractJsonFromMarkdown(text: string): string {
  const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
  const match = text.match(jsonRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return text;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { count = 1,  language = 'en' } = await request.json();
    console.log(`API generate-tasks-own called with language: ${language}, count: ${count}`);
    
    try {
      // Generate tasks using Vertex AI with Gemini 2.0 Flash Lite
      const tasks = await generateTasksWithVertexAI(count, language);
      
      if (!tasks || !Array.isArray(tasks)) {
        console.error('Invalid response format from Vertex AI:', tasks);
        throw new Error('Invalid response format from Vertex AI');
      }

      console.log(`Successfully generated ${tasks.length} tasks`);
      return NextResponse.json(tasks);
    } catch (error) {
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

async function generateTasksWithVertexAI(count: number, language: 'en' | 'de' = 'en'): Promise<Task[]> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Using the REST API directly since the Node.js client doesn't support API key auth directly
    const prompt = `Generate a language learning task for ${language === 'en' ? 'English' : 'German'} learners. 
    
The task should help users practice their vocabulary and language skills with practical, everyday scenarios.

Format your response as a JSON object with the following structure:
{
  "language": "${language}",
  "question": "A question that prompts using a specific word or phrase in ${language === 'en' ? 'English' : 'German'}",
  "meantWord": "The target word or phrase that should be used in the answer",
  "alternativeWords": ["array", "of", "similar", "words", "or", "synonyms"],
  "example": "An example sentence using the target word in context"
}

Make the question natural and conversational. Focus on common, useful vocabulary and phrases.`;

    // Call the Gemini model using REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Gemini API response received');

    if (!result || !result.candidates || result.candidates.length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    const content = result.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API');
    }

    const textContent = content.parts[0].text;
    console.log(`Raw content from Gemini API (first 100 chars): ${textContent.substring(0, 100)}...`);

    // Extract JSON if needed and parse it
    const jsonContent = extractJsonFromMarkdown(textContent);
    console.log("Extracted JSON content:", jsonContent);
    
    try {
      const parsedData: WordTask = JSON.parse(jsonContent);
      
      // Transform the received data into the required task format
      const timestamp = Date.now();
      const tasks = [];
      
      for (let i = 0; i < count; i++) {
        tasks.push({
          id: `task_${timestamp}_${Math.floor(Math.random() * 1000)}_${i}`,
          type: 'free_response' as const,
          question: parsedData.question,
          answer: parsedData.meantWord,
          alternativeWords: parsedData.alternativeWords,
          example: parsedData.example,
          points: 15,
          isCustom: true
        });
      }
      
      return tasks;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      
      // Fallback for invalid responses
      const timestamp = Date.now();
      return [{
        id: `task_${timestamp}_${Math.floor(Math.random() * 1000)}`,
        type: 'free_response' as const,
        question: language === 'en' 
          ? "How would you express 'I'm making progress' in a sentence about learning a new language?" 
          : "Wie würden Sie 'Ich mache Fortschritte' in einem Satz über das Erlernen einer neuen Sprache verwenden?",
        answer: language === 'en' ? "making progress" : "Fortschritte machen",
        alternativeWords: language === 'en' 
          ? ["improving", "advancing", "developing"] 
          : ["sich verbessern", "vorankommen", "sich entwickeln"],
        example: language === 'en'
          ? "I'm making progress with my Spanish vocabulary." 
          : "Ich mache Fortschritte mit meinem spanischen Wortschatz.",
        points: 15,
        isCustom: true
      }];
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
} 