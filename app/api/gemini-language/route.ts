import { NextResponse } from 'next/server';

// Types for request
type QueryType = 'definition' | 'check' | 'ask';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { word, language, queryType } = await request.json();
    
    if (!word) {
      return NextResponse.json({ 
        error: 'Word or query is required'
      }, { status: 400 });
    }
    
    console.log(`API gemini-language called for: "${word}" with type ${queryType} in ${language}`);
    
    try {
      // Get language assistance with Gemini
      const result = await getLanguageAssistanceWithGemini(word, language, queryType);
      
      console.log('Successfully generated language assistance');
      return NextResponse.json(result);
    } catch (error) {
      console.error(`Error getting language assistance:`, error);
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

async function getLanguageAssistanceWithGemini(
  query: string, 
  language: 'en' | 'de' = 'en', 
  queryType: QueryType = 'definition'
): Promise<{
  title: string;
  answer: string;
  suggestions: string[];
  modelUsed: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Create system prompt based on query type
    let systemPrompt = '';
    let userPrompt = '';
    
    if (queryType === 'definition') {
      systemPrompt = `You are a precise language assistant specialized in providing clear definitions in ${language === 'en' ? 'English' : 'German'}. Format your response with markdown, focusing on the exact meaning, usage, and examples of the term.  Be as precise as possible, please avoid writing more than 100 words!!!`;
      userPrompt = language === 'en' 
        ? `Provide a precise, clear definition for: "${query}" in English. Include part of speech, meaning, usage examples, and related forms if relevant.`
        : `Gib eine präzise, klare Definition für: "${query}" auf Deutsch. Füge Wortart, Bedeutung, Verwendungsbeispiele und verwandte Formen an, wenn relevant.`;
    } 
    else if (queryType === 'check') {
      systemPrompt = `You are a language checker that identifies errors, awkward phrasings, and unnatural expressions in ${language === 'en' ? 'English' : 'German'} text. Provide specific corrections and improvements. Format your response with markdown.  Be as precise as possible, please avoid writing more than 100 words!!!`;
      userPrompt = language === 'en'
        ? `Check this phrase or sentence for correctness and naturalness: "${query}" in English. Point out any errors, awkward phrasings, or unnatural expressions. Suggest improvements.`
        : `Überprüfe diesen Satz oder diese Phrase auf Korrektheit und Natürlichkeit: "${query}" auf Deutsch. Zeige Fehler, ungeschickte Formulierungen oder unnatürliche Ausdrücke auf. Schlage Verbesserungen vor.`;
    }
    else if (queryType === 'ask') {
      systemPrompt = `You are a language expert that answers specific questions about ${language === 'en' ? 'English' : 'German'} language usage, grammar, vocabulary, and linguistics. Address the exact question directly and comprehensively. Format your response with markdown. Be as precise as possible, please avoid writing more than 100 words!!!`;
      userPrompt = language === 'en'
        ? `Answer this language-related question: "${query}" in English. Provide a comprehensive explanation tailored specifically to this question.`
        : `Beantworte diese sprachbezogene Frage: "${query}" auf Deutsch. Gib eine umfassende Erklärung, die speziell auf diese Frage zugeschnitten ist.`;
    }
    
    // First request: Get the main answer
    const responseAnswer = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!responseAnswer.ok) {
      const errorData = await responseAnswer.json();
      throw new Error(`Gemini API error (answer): ${JSON.stringify(errorData)}`);
    }

    const resultAnswer = await responseAnswer.json();
    if (!resultAnswer || !resultAnswer.candidates || resultAnswer.candidates.length === 0) {
      throw new Error('Empty response from Gemini API (answer)');
    }

    const contentAnswer = resultAnswer.candidates[0].content;
    if (!contentAnswer || !contentAnswer.parts || contentAnswer.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API (answer)');
    }

    const answer = contentAnswer.parts[0].text;
    
    // Second request: Get meta information (title and suggestions)
    const metaPrompt = `Based on this language query: "${query}" in ${language === 'en' ? 'English' : 'German'}, provide:
    1. A concise title that represents the main word, idiom, or expression being discussed (not the question itself)
    2. Four relevant language learning follow-up questions. They should refer to the request and be related to language learning, grammar, usage, idioms, expressions, etc.
    
    Return your response as a JSON object with these fields:
    - "title": The main word, idiom, or expression (keep it short and focused)
    - "suggestions": An array of exactly 4 relevant language learning follow-up questions`;

    const responseMeta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: "You extract the key information from language queries and generate helpful follow-up questions for language learners. Respond using valid JSON format only." },
                { text: metaPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!responseMeta.ok) {
      const errorData = await responseMeta.json();
      throw new Error(`Gemini API error (meta): ${JSON.stringify(errorData)}`);
    }

    const resultMeta = await responseMeta.json();
    if (!resultMeta || !resultMeta.candidates || resultMeta.candidates.length === 0) {
      throw new Error('Empty response from Gemini API (meta)');
    }

    const contentMeta = resultMeta.candidates[0].content;
    if (!contentMeta || !contentMeta.parts || contentMeta.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API (meta)');
    }

    const metaText = contentMeta.parts[0].text;
    
    // Extract JSON from the response
    let jsonContent = metaText;
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = metaText.match(jsonRegex);
    
    if (match && match[1]) {
      jsonContent = match[1].trim();
    }
    
    let title = '';
    let suggestions: string[] = [];
    
    try {
      const parsedData = JSON.parse(jsonContent);
      title = parsedData.title || extractTitleFromQuery(query);
      suggestions = Array.isArray(parsedData.suggestions) ? parsedData.suggestions : generateDefaultSuggestions(query, language);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      title = extractTitleFromQuery(query);
      suggestions = generateDefaultSuggestions(query, language);
    }
    
    // Ensure exactly 4 suggestions
    while (suggestions.length < 4) {
      suggestions.push(`Tell me more about ${title}`);
    }
    suggestions = suggestions.slice(0, 4);
    
    return {
      title,
      answer,
      suggestions,
      modelUsed: 'gemini'
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Helper function to extract a title from the query if the API call fails
function extractTitleFromQuery(query: string): string {
  // Simple extraction - get the first few words, max 30 chars
  const words = query.split(/\s+/);
  let title = words.slice(0, 3).join(' ');
  
  if (title.length > 30) {
    title = title.substring(0, 27) + '...';
  }
  
  return title;
}

// Generate default suggestions if the API call fails
function generateDefaultSuggestions(query: string, language: 'en' | 'de'): string[] {
  const simplifiedQuery = query.length > 20 ? query.substring(0, 20) + '...' : query;
  
  if (language === 'en') {
    return [
      `What is the etymology of "${simplifiedQuery}"?`,
      `What are some common phrases using "${simplifiedQuery}"?`,
      `How would I use "${simplifiedQuery}" in a sentence?`,
      `What are the synonyms for "${simplifiedQuery}"?`
    ];
  } else {
    return [
      `Was ist die Etymologie von "${simplifiedQuery}"?`,
      `Was sind gebräuchliche Redewendungen mit "${simplifiedQuery}"?`,
      `Wie würde ich "${simplifiedQuery}" in einem Satz verwenden?`,
      `Was sind Synonyme für "${simplifiedQuery}"?`
    ];
  }
} 