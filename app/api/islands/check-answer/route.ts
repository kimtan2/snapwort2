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
  revised_polished_version: string;
  natural_chunks: Array<{
    category: string;
    expressions: string[];
  }>;
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const vocabularyContext = vocabulary && vocabulary.length > 0 
      ? `\n\nRelevant vocabulary for this question:\n${vocabulary.map(v => `- ${v.text}: ${v.meaning} (${v.type})`).join('\n')}`
      : '';
    
    const hintsContext = hints && hints.length > 0 
      ? `\n\nHints provided:\n${hints.map((hint, i) => `${i + 1}. ${hint}`).join('\n')}`
      : '';
    
    const prompt = `You are an expert ${language === 'en' ? 'English' : 'German'} language teacher evaluating a student's speaking practice response.

Question: "${question}"
${hintsContext}
${vocabularyContext}

Student's Answer: "${answer}"

Please evaluate this answer and provide feedback in the following JSON format:

{
  "score": number, // Score from 1-100 based on content relevance, language accuracy, natural flow, and vocabulary usage
  "revised_polished_version": "A complete, polished version of the student's response using natural ${language === 'en' ? 'English' : 'German'} while maintaining their original ideas and structure",
  "natural_chunks": [
    {
      "category": "relevant functional category based on the topic",
      "expressions": [
        "useful expression 1 from polished version",
        "useful expression 2 from polished version", 
        "useful expression 3 from polished version"
      ]
    },
    {
      "category": "another relevant functional category",
      "expressions": [
        "useful expression 1 from polished version",
        "useful expression 2 from polished version",
        "useful expression 3 from polished version"
      ]
    }
  ]
}

Focus on:
1. Creating a polished version that sounds natural while keeping the student's original ideas and flow
2. Extracting key expressions and chunks FROM the polished version that demonstrate natural, native-like language
3. Organizing these expressions by functional categories relevant to the specific topic and question type
4. Ensure the chunks directly correspond to what the student was trying to express and can be applied to similar discussion topics
5. Providing a fair score that reflects content quality, language accuracy, natural flow, and vocabulary usage

The natural chunks should be taken directly from your polished version to show the student exactly which expressions they should learn to improve their speaking.

Respond only in valid JSON format.`;

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
        revised_polished_version: parsedData.revised_polished_version || answer,
        natural_chunks: Array.isArray(parsedData.natural_chunks) ? parsedData.natural_chunks : [
          {
            category: "General Expression",
            expressions: ["Keep practicing!", "You're making good progress", "Try to expand your ideas"]
          }
        ]
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Provide a fallback response
      return {
        score: 70,
        revised_polished_version: answer,
        natural_chunks: [
          {
            category: "Practice Encouragement",
            expressions: ["You provided a response", "You attempted to answer the question", "You're practicing actively"]
          },
          {
            category: "Areas for Improvement", 
            expressions: ["Try to expand your ideas", "Use more descriptive language", "Practice organizing your thoughts clearly"]
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}