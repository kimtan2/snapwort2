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
    
    const analysis = await analyzeResponseWithMistralAgent(statement, userResponse, context);
    
    console.log('Successfully analyzed response');
    return NextResponse.json(analysis);
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
    
    // Create the conversation input
    const conversationInput = {
      inputs: [
        {
          role: "user",
          content: JSON.stringify({
            context: context,
            situation: situation,
            userResponse: userResponse
          })
        }
      ],
      agent_id: agentId
    };

    console.log('Starting conversation with agent:', agentId);

    // Use the new conversations endpoint to start a conversation with the agent
    const response = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(conversationInput),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Mistral API error (${response.status}):`, errorData);
      
      // If it's a 404, the agent ID might be incorrect
      if (response.status === 404) {
        throw new Error(`Mistral Agent not found. Please check your MISTRAL_AGENT_MISSION_ASSESSMENT_ID_KEY environment variable.`);
      }
      
      throw new Error(`Mistral API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Conversation response received');
    
    if (!result || !result.outputs || result.outputs.length === 0) {
      throw new Error('Empty response from Mistral API');
    }

    // Extract the assistant's response from the conversation outputs
    const assistantMessage = result.outputs.find((output: any) => 
      output.type === 'message.output' && output.role === 'assistant'
    );

    if (!assistantMessage || !assistantMessage.content) {
      throw new Error('No assistant response found in conversation');
    }

    // Parse the response content
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage.content);
    } catch (parseError) {
      console.error('Failed to parse assistant response as JSON:', assistantMessage.content);
      // Try to extract JSON from the content if it's wrapped in text
      const jsonMatch = assistantMessage.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Assistant response is not valid JSON');
      }
    }

    // Return the parsed response with fallbacks
    return {
      briefFeedback: parsedResponse.briefFeedback || "Great job expressing your thoughts clearly!",
      vocabularyImprovements: Array.isArray(parsedResponse.vocabularyImprovements) 
        ? parsedResponse.vocabularyImprovements.slice(0, 3) // Ensure max 3
        : ["Try using more specific adjectives to strengthen your arguments"]
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
      ]
    };
  }
}