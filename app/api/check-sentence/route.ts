import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { sentence, word, language } = await request.json();
    
    if (!sentence || !word) {
      return NextResponse.json({ 
        error: 'Both sentence and word are required'
      }, { status: 400 });
    }
    
    console.log(`API check-sentence called for word "${word}" in ${language}`);
    
    try {
      // Check the sentence with Gemini 2.0 Flash Lite
      const feedback = await checkSentenceWithGemini(sentence, word, language);
      
      console.log('Successfully generated feedback');
      return NextResponse.json(feedback);
    } catch (error) {
      console.error(`Error checking sentence:`, error);
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

async function checkSentenceWithGemini(
  sentence: string, 
  word: string, 
  language: 'en' | 'de' = 'en'
): Promise<{
  isCorrect: boolean;
  feedback: string;
  improvedSentence?: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const prompt = `
I'm learning ${language === 'en' ? 'English' : 'German'} vocabulary and trying to practice using the word "${word}" in a sentence.

Here is my sentence: "${sentence}"

Please check if my sentence correctly uses the word "${word}" and provide feedback.

Format your response as a JSON object with the following structure:
{
  "isCorrect": boolean, // true if the sentence is correct grammatically and uses the word properly, false otherwise
  "feedback": "detailed feedback on the sentence, including grammar issues, word usage, etc. Place great emphasis on the word usage and whether it is used naturally or not. How would the native speaker use the word?",
  "improvedSentence": "a corrected or improved version of the original sentence that maintains the same meaning. Also, include some other much better expanded examples of how to use the word correctly and naturally."
}

Make sure the feedback is encouraging and helpful, focusing on both strengths and areas for improvement.`;

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
            temperature: 0.2, // Lower temperature for more consistent feedback
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
    console.log('Gemini API response received for sentence check');

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
      
      // Return the feedback results
      return {
        isCorrect: parsedData.isCorrect || false,
        feedback: parsedData.feedback || "I couldn't properly analyze your sentence, but it looks like you're making an effort. Keep practicing!",
        improvedSentence: parsedData.improvedSentence || undefined
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Provide a fallback response
      return {
        isCorrect: false,
        feedback: "I encountered an error while analyzing your sentence, but it's great that you're practicing. Try again with another sentence!",
        improvedSentence: undefined
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
} 