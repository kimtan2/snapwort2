import { NextResponse } from 'next/server';

type ChatContext = {
  question: string;
  answer: string;
};

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { question, language, previousContext } = await request.json();
    
    if (!question) {
      return NextResponse.json({ 
        error: 'Question is required'
      }, { status: 400 });
    }
    
    console.log(`API gemini-followup called for question in ${language}`);
    
    try {
      // Get follow-up answer with Gemini
      const result = await getFollowUpWithGemini(question, language, previousContext);
      
      console.log('Successfully generated follow-up response');
      return NextResponse.json(result);
    } catch (error) {
      console.error(`Error getting follow-up response:`, error);
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

async function getFollowUpWithGemini(
  question: string, 
  language: 'en' | 'de' = 'en',
  previousContext?: ChatContext[]
): Promise<{
  answer: string;
  modelUsed: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Build the conversation content
    const contents: {
      role: 'user' | 'model';
      parts: { text: string }[];
    }[] = [];
    
    // Add system message
    contents.push({
      role: 'user',
      parts: [{ 
        text: `You are a helpful language tutor specializing in ${language === 'en' ? 'English' : 'German'} language. 
        Provide educational, clear, and comprehensive answers to language questions. Format your response with markdown.` 
      }]
    });
    
    // Add previous context if available
    if (previousContext && previousContext.length > 0) {
      // Add the initial query and its answer
      contents.push({
        role: 'user',
        parts: [{ text: previousContext[0].question }]
      });
      
      contents.push({
        role: 'model',
        parts: [{ text: previousContext[0].answer }]
      });
      
      // Add any follow-up conversations (skip the first one as we've already added it)
      for (let i = 1; i < previousContext.length; i++) {
        contents.push({
          role: 'user',
          parts: [{ text: previousContext[i].question }]
        });
        
        contents.push({
          role: 'model',
          parts: [{ text: previousContext[i].answer }]
        });
      }
    }
    
    // Add the current question
    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });
    
    // Call the Gemini model using REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error (followup): ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (!result || !result.candidates || result.candidates.length === 0) {
      throw new Error('Empty response from Gemini API (followup)');
    }

    const content = result.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API (followup)');
    }

    const answer = content.parts[0].text;
    
    return {
      answer,
      modelUsed: 'gemini'
    };
  } catch {
    console.error("Error calling Gemini API for follow-up:");
    throw new Error("Failed to get response from Gemini API");
  }
} 