import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { statement, position, userResponse, context } = await request.json();
    
    if (!statement || !position || !userResponse) {
      return NextResponse.json({ 
        error: 'Statement, position, and user response are required'
      }, { status: 400 });
    }
    
    console.log(`Analyzing response for position: ${position}`);
    
    try {
      const analysis = await analyzeResponseWithGemini(statement, position, userResponse, context);
      
      console.log('Successfully analyzed response');
      return NextResponse.json(analysis);
    } catch (error) {
      console.error(`Error analyzing response:`, error);
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

async function analyzeResponseWithGemini(
  statement: string, 
  position: string, 
  userResponse: string, 
  context: string
): Promise<{
  briefFeedback: string;
  vocabularyImprovements: string[];
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const prompt = `You are analyzing a language learner's response to a controversial statement in a discussion exercise.

Context: ${context}
Statement: "${statement}"
User's position: ${position}
User's response: "${userResponse}"

Provide feedback in this exact JSON format:
{
  "briefFeedback": "One sentence of encouraging feedback about their argument or expression",
  "vocabularyImprovements": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Guidelines:
- briefFeedback: One sentence only! Be encouraging but specific about what they did well in their argument or language use.
- vocabularyImprovements: Exactly 1-3 concrete vocabulary suggestions that would make their response more sophisticated or natural. Focus on better word choices, phrases, or expressions they could have used.

Examples of good vocabulary improvements:
- "Instead of 'I think', try 'I believe' or 'In my opinion' for stronger expression"
- "Use 'furthermore' or 'moreover' instead of 'also' to sound more academic"
- "Replace 'really good' with 'highly effective' or 'extremely beneficial'"

Respond only with valid JSON. No other text.`;

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
            temperature: 0.3,
            maxOutputTokens: 300,
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

    const textContent = content.parts[0].text;
    
    // Extract JSON from markdown if needed
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = textContent.match(jsonRegex);
    
    let jsonContent = textContent;
    if (match && match[1]) {
      jsonContent = match[1].trim();
    }
    
    try {
      const parsedData = JSON.parse(jsonContent);
      
      return {
        briefFeedback: parsedData.briefFeedback || "Great job expressing your thoughts clearly!",
        vocabularyImprovements: Array.isArray(parsedData.vocabularyImprovements) 
          ? parsedData.vocabularyImprovements.slice(0, 3) // Ensure max 3
          : ["Try using more specific adjectives to strengthen your arguments"]
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      
      // Fallback response
      return {
        briefFeedback: "You presented your position clearly and provided relevant supporting points.",
        vocabularyImprovements: [
          "Consider using transition words like 'furthermore' or 'however' to connect ideas",
          "Try replacing common words with more sophisticated alternatives",
          "Use specific examples to make your arguments more compelling"
        ]
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Fallback response for any error
    return {
      briefFeedback: "You did well articulating your perspective on this topic.",
      vocabularyImprovements: [
        "Expand your vocabulary with more precise adjectives",
        "Use connecting phrases to improve flow between ideas",
        "Include specific examples to support your points"
      ]
    };
  }
}