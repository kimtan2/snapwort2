import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { answer, question, hints, vocabulary, language = 'en' } = await request.json();
    
    if (!answer || !question) {
      return NextResponse.json({ 
        error: 'Both answer and question are required'
      }, { status: 400 });
    }
    
    console.log(`API islands/check-answer called for question in ${language}`);
    
    try {
      // Check the answer with Gemini 2.0 Flash Lite
      const result = await checkAnswerWithGemini(answer, question, hints, vocabulary, language);
      
      console.log('Successfully generated answer feedback');
      return NextResponse.json(result);
    } catch (error) {
      console.error(`Error checking answer:`, error);
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

async function checkAnswerWithGemini(
  answer: string,
  question: string,
  hints: string[],
  vocabulary: Array<{ text: string; meaning: string; type: string }>,
  language: 'en' | 'de' = 'en'
): Promise<{
  score: number;
  feedback: string;
  improvedAnswer: string;
  strengths: string[];
  improvements: string[];
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const vocabularyContext = vocabulary && vocabulary.length > 0 
      ? `\n\nRelevant vocabulary for this question:\n${vocabulary.map(v => `- ${v.text}: ${v.meaning} (${v.type})`).join('\n')}`
      : '';
    
    const hintsContext = hints && hints.length > 0 
      ? `\n\nHints provided:\n${hints.map((hint, i) => `${i + 1}. ${hint}`).join('\n')}`
      : '';
    
    const prompt = `
You are an expert ${language === 'en' ? 'English' : 'German'} language teacher evaluating a student's speaking practice response.

Question: "${question}"
${hintsContext}
${vocabularyContext}

Student's Answer: "${answer}"

Please evaluate this answer and provide detailed feedback. Consider:
1. Content relevance and completeness
2. Language accuracy (grammar, vocabulary usage)
3. Natural flow and coherence
4. Use of relevant vocabulary from the provided list
5. Following the hints provided

Format your response as a JSON object with the following structure:
{
  "score": number, // Score from 1-100
  "feedback": "detailed constructive feedback focusing on what they did well and what could be improved",
  "improvedAnswer": "an improved version of their answer that maintains their ideas but enhances language, structure, and vocabulary usage",
  "strengths": ["strength 1", "strength 2", "strength 3"], // What they did well
  "improvements": ["improvement 1", "improvement 2", "improvement 3"] // Specific areas to work on
}

Be encouraging and constructive. Focus on practical improvements they can apply to future responses.`;

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
            temperature: 0.3, // Lower temperature for more consistent feedback
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
    console.log('Gemini API response received for answer check');

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
      
      // Return the feedback results with fallbacks
      return {
        score: parsedData.score || 75,
        feedback: parsedData.feedback || "Good effort! Keep practicing to improve your language skills.",
        improvedAnswer: parsedData.improvedAnswer || answer,
        strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : ["You attempted the question", "You used relevant language", "You stayed on topic"],
        improvements: Array.isArray(parsedData.improvements) ? parsedData.improvements : ["Try to expand your ideas", "Use more varied vocabulary", "Practice connecting sentences smoothly"]
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Provide a fallback response
      return {
        score: 70,
        feedback: "I had trouble analyzing your response in detail, but you're making good progress! Keep practicing and focus on using clear, complete sentences.",
        improvedAnswer: answer,
        strengths: ["You provided a response", "You attempted to answer the question", "You're practicing actively"],
        improvements: ["Try to expand your ideas", "Use more descriptive language", "Practice organizing your thoughts clearly"]
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}