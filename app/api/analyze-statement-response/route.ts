import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ 
        error: 'Mistral API key is not configured. Please set the MISTRAL_API_KEY environment variable.'
      }, { status: 500 });
    }

    if (!process.env.MISTRAL_AGENT_MISSION_ASSESSMENT_ID_KEY) {
      return NextResponse.json({ 
        error: 'Mistral Agent ID is not configured. Please set the MISTRAL_AGENT_MISSION_ASSESSMENT_ID_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { statement, position, userResponse, context } = await request.json();
    
    if (!statement || !userResponse) {
      return NextResponse.json({ 
        error: 'Statement and user response are required'
      }, { status: 400 });
    }
    
    console.log(`Analyzing response for situation: ${statement}`);
    
    try {
      const analysis = await analyzeResponseWithMistralAgent(statement, userResponse, context);
      
      console.log('Successfully analyzed response with Mistral agent');
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

async function analyzeResponseWithMistralAgent(
  situation: string, 
  userResponse: string, 
  context: string
): Promise<{
  briefFeedback: string;
  vocabularyImprovements: string[];
}> {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    const agentId = process.env.MISTRAL_AGENT_MISSION_ASSESSMENT_ID_KEY;
    
    // Input structure for Mistral agent
    const requestBody = {
      context: context,
      situation: situation,
      userResponse: userResponse
    };

    const response = await fetch(`https://api.mistral.ai/v1/agents/${agentId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Mistral Agent API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (!result) {
      throw new Error('Empty response from Mistral Agent API');
    }

    // Mistral agent should return JSON directly
    return {
      briefFeedback: result.briefFeedback || "Great job expressing your thoughts clearly!",
      vocabularyImprovements: Array.isArray(result.vocabularyImprovements) 
        ? result.vocabularyImprovements.slice(0, 3) // Ensure max 3
        : ["Try using more specific adjectives to strengthen your arguments"]
    };
  } catch (error) {
    console.error("Error calling Mistral Agent API:", error);
    
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