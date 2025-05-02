import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { word, language } = await request.json();
    
    if (!word) {
      return NextResponse.json({ 
        error: 'Word is required'
      }, { status: 400 });
    }
    
    console.log(`API word-suggestions called for word "${word}" in ${language}`);
    
    try {
      // Get suggestions for the word with Gemini 2.0 Flash Lite
      const suggestions = await getWordSuggestionsWithGemini(word, language);
      
      console.log('Successfully generated suggestions');
      return NextResponse.json(suggestions);
    } catch (error) {
      console.error(`Error getting word suggestions:`, error);
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

async function getWordSuggestionsWithGemini(word: string, language: 'en' | 'de' = 'en'): Promise<{
  examples: string[];
  tips: string[];
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const prompt = `
I'm learning ${language === 'en' ? 'English' : 'German'} vocabulary and want to know how to use the word "${word}" in sentences.

Please provide usage examples and tips for this word.

Format your response as a JSON object with the following structure:
{
  "examples": [
    "example sentence 1 using the word",
    "example sentence 2 using the word",
    "example sentence 3 using the word"
  ],
  "tips": [
    "usage tip 1",
    "usage tip 2",
    "alternative phrasings or collocations"
  ]
}

Provide 3-5 natural, everyday examples that show different ways to use the word. The tips should help me understand how to use the word properly in different contexts.`;

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
            temperature: 0.3,
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
    console.log('Gemini API response received for word suggestions');

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
      
      // Return the suggestions
      return {
        examples: Array.isArray(parsedData.examples) ? parsedData.examples : [],
        tips: Array.isArray(parsedData.tips) ? parsedData.tips : []
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Provide a fallback response
      return {
        examples: [
          `Here's an example with "${word}".`,
          `You can use "${word}" in various contexts.`
        ],
        tips: [
          `Try to use "${word}" in everyday conversations.`,
          `Practice makes perfect!`
        ]
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
} 