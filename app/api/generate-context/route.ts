import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { statement } = await request.json();
    
    if (!statement) {
      return NextResponse.json({ 
        error: 'Statement is required'
      }, { status: 400 });
    }
    
    console.log(`Generating context for statement: "${statement}"`);
    
    try {
      const context = await generateContextWithGemini(statement);
      
      console.log('Successfully generated context');
      return NextResponse.json({ context });
    } catch (error) {
      console.error(`Error generating context:`, error);
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

async function generateContextWithGemini(statement: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const prompt = `You are creating a discussion context for a language learning exercise. 

Given this statement: "${statement}"

Create a short, natural context (1-2 sentences) for a discussion scenario. Examples:
- "You are having coffee with a friend and this topic comes up in conversation."
- "You're at a dinner party and someone mentions this during casual discussion."
- "A colleague brings this up during your lunch break."
- "You're discussing current events with your family."

Make it feel natural and conversational. Only respond with the context, nothing else.`;

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
            temperature: 0.8,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (!result || !result.candidates || result.candidates.length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    const content = result.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API');
    }

    return content.parts[0].text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback contexts
    const fallbackContexts = [
      "You're having a casual conversation with a friend over coffee.",
      "The topic comes up during a family dinner discussion.",
      "You're chatting with colleagues during your lunch break.",
      "You're at a social gathering and this topic comes up naturally."
    ];
    return fallbackContexts[Math.floor(Math.random() * fallbackContexts.length)];
  }
}