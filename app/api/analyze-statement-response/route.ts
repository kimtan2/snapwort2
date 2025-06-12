import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ 
        error: 'Mistral API key is not configured. Please set the MISTRAL_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { statement, position, userResponse, context } = await request.json();
    
    if (!statement || !userResponse) {
      return NextResponse.json({ 
        error: 'Statement and user response are required'
      }, { status: 400 });
    }
    
    console.log(`Analyzing response for situation: ${statement}`);
    
    const analysis = await analyzeResponseWithMistralSmall(statement, userResponse, context, position);
    
    console.log('Successfully analyzed response');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error parsing request:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }, { status: 400 });
  }
}

async function analyzeResponseWithMistralSmall(
  situation: string, 
  userResponse: string, 
  context: string,
  position?: string
): Promise<{
  briefFeedback: string;
  vocabularyImprovements: string[];
  polishedVersion: string;
}> {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    // Determine if this is a statement analysis or situation response
    const isStatementAnalysis = position && (position === 'agree' || position === 'disagree');
    
    // Enhanced system prompt with polished version requirement
    const systemPrompt = `You are a language learning evaluation assistant. Your task is to analyze learner responses to conversational scenarios and provide constructive feedback along with a polished version of their response.

Core Function
Analyze the learner's response for:
• Situational appropriateness and comprehension
• Natural language flow and expression
• Vocabulary usage and sophistication
• Grammar and syntax accuracy
• Conversational engagement

Response Requirements
You MUST respond with valid JSON only. No additional text before or after the JSON object.

JSON Structure
{
  "briefFeedback": "One encouraging sentence about what they did well",
  "vocabularyImprovements": [
    "Specific suggestion with example",
    "Another concrete improvement",
    "Additional suggestion if needed"
  ],
  "polishedVersion": "A complete, polished version of the student's response using natural English while maintaining their original ideas and structure"
}

Evaluation Guidelines
briefFeedback Rules:
• Briefly assess 1) relevance (no off topic?) 2) naturalness of the response
• Be specific.
• Keep to exactly one sentence.

vocabularyImprovements Rules:
• Provide 3-6 concrete, actionable suggestions
• Use format: "Instead of X, say Y" or "Replace X with Y" when correcting specific phrases
• Include grammar corrections for obvious errors (typos, wrong prepositions, etc.)
• Suggest more natural or sophisticated alternatives
• Focus on the most impactful improvements first
• Add conversation flow suggestions when appropriate (questions to ask, responses to give)
• Identify vocabulary gaps and provide learning opportunities

polishedVersion Rules:
• Create a complete, natural-sounding version of their response
• Maintain the student's original intent and meaning
• Keep the same general structure and flow
• Use natural, conversational English appropriate for the context
• Fix grammar errors and improve vocabulary choices
• Ensure the response sounds like a native speaker would say it
• Keep the same level of formality as the original context
• Don't change the core message or add completely new ideas

Special Cases:
• Off-topic responses: Gently redirect while staying positive in feedback, but still provide a polished version that addresses the actual situation
• Major misunderstandings: Address the situational context first in feedback, provide a polished version that shows proper understanding
• Grammar errors: Include corrections but frame them constructively
• Typos: Mention them briefly but don't make them the focus
• Cultural context: Explain social expectations when relevant

Quality Standards
• Be helpful and educational, not just corrective
• Provide examples the learner can immediately use
• Balance encouragement with useful feedback
• Focus on practical improvements for real conversations
• Ensure the polished version demonstrates the vocabulary improvements you suggest

Remember: Respond with valid JSON only. No explanatory text outside the JSON structure.`;

    // Create the user message with the specific scenario
    const userMessage = `Context: ${context}
${isStatementAnalysis ? 'Statement' : 'Situation'}: "${situation}"
${isStatementAnalysis ? `User's position: ${position}` : 'User\'s position: responding to situation'}
User's response: "${userResponse}"

Please analyze this response and provide feedback with a polished version.`;

    console.log('Calling Mistral Small API...');

    // Use regular Mistral chat completions API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 1000, // Increased for polished version
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Mistral API error (${response.status}):`, errorData);
      throw new Error(`Mistral API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Mistral API response received');
    
    if (!result || !result.choices || result.choices.length === 0) {
      throw new Error('Empty response from Mistral API');
    }

    const assistantMessage = result.choices[0].message;
    if (!assistantMessage || !assistantMessage.content) {
      throw new Error('No assistant response found');
    }

    // Parse the response content
    let parsedResponse;
    try {
      // Try to parse as JSON first
      parsedResponse = JSON.parse(assistantMessage.content);
    } catch (parseError) {
      console.error('Failed to parse assistant response as JSON:', assistantMessage.content);
      
      // Try to extract JSON from the content if it's wrapped in text or markdown
      const jsonMatch = assistantMessage.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       assistantMessage.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonContent = jsonMatch[1] || jsonMatch[0];
          parsedResponse = JSON.parse(jsonContent);
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0]);
          throw new Error('Assistant response is not valid JSON');
        }
      } else {
        throw new Error('No JSON found in assistant response');
      }
    }

    // Return the parsed response with fallbacks
    return {
      briefFeedback: parsedResponse.briefFeedback || "Good job expressing your thoughts clearly!",
      vocabularyImprovements: Array.isArray(parsedResponse.vocabularyImprovements) 
        ? parsedResponse.vocabularyImprovements.slice(0, 6)
        : ["Try using more specific adjectives to strengthen your arguments"],
      polishedVersion: parsedResponse.polishedVersion || userResponse
    };
  } catch (error) {
    console.error("Error calling Mistral API:", error);
    
    // Fallback response for any error
    return {
      briefFeedback: "You did well articulating your perspective on this topic.",
      vocabularyImprovements: [
        "Expand your vocabulary with more precise adjectives",
        "Use connecting phrases to improve flow between ideas",
        "Include specific examples to support your points"
      ],
      polishedVersion: userResponse
    };
  }
}