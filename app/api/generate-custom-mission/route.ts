import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: 'Google API key is not configured. Please set the GOOGLE_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    const { missionData } = await request.json();
    
    if (!missionData) {
      return NextResponse.json({ 
        error: 'Mission data is required'
      }, { status: 400 });
    }
    
    console.log(`Generating custom mission based on user data:`, missionData);
    
    try {
      const customMission = await generateCustomMissionWithGemini(missionData);
      
      console.log('Successfully generated custom mission');
      return NextResponse.json(customMission);
    } catch (error) {
      console.error(`Error generating custom mission:`, error);
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

async function generateCustomMissionWithGemini(missionData: {
  type: string;
  subType: string;
  question?: string;
  situation?: string;
  task?: string;
  aiNotes?: string;
}): Promise<{
  statement: string;
  context: string;
  missionType: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    let prompt = '';
    
    if (missionData.subType === 'agreeDisagree') {
      // Type A: Generate controversial statement for agree/disagree
      prompt = `You are creating a statement analysis mission for language learning.

User Requirements:
- Question/Topic: "${missionData.question}"
- AI Notes: "${missionData.aiNotes || 'None'}"

Create a controversial statement based on the user's question that allows for both agreement and disagreement. Also provide a natural conversational context.

Return your response as JSON with this exact format:
{
  "statement": "A controversial statement that relates to the user's question and prompts discussion",
  "context": "A natural, conversational context where this topic might come up (1-2 sentences)",
  "missionType": "agreeDisagree"
}

Guidelines:
- The statement should be thought-provoking and allow for both agreement and disagreement
- Make it relevant to the user's specified question/topic
- The context should feel natural and realistic
- Consider the AI notes when formulating the statement complexity and focus areas

Example format:
{
  "statement": "Social media platforms should be held legally responsible for the mental health impacts of their algorithms on teenagers.",
  "context": "You're having a discussion with friends about technology and its effects on young people.",
  "missionType": "agreeDisagree"
}

Respond only with valid JSON.`;
    } else {
      // Type B: Generate situational reaction scenario
      prompt = `You are creating a situational reaction mission for language learning.

User Requirements:
- Situation: "${missionData.situation}"
- Task: "${missionData.task}"
- AI Notes: "${missionData.aiNotes || 'None'}"

Create a specific scenario where someone (like a friend, colleague, or family member) is in the described situation, and the user needs to respond according to the task. Make it feel like a real conversation.

Return your response as JSON with this exact format:
{
  "statement": "What the other person says to you about their situation",
  "context": "Setting up the scenario - who is speaking and in what context",
  "missionType": "situationReact"
}

Guidelines:
- The statement should be what someone would actually say in this situation
- Make it feel natural and conversational
- The context should set up who is speaking and where
- Consider the AI notes for the tone and complexity
- The user should be able to naturally respond with empathy, advice, or appropriate reaction

Example:
If situation is "friend lost his stuff" and task is "react to that":
{
  "statement": "I can't believe it! I've been looking everywhere for my keys and wallet. I think I left them at the restaurant, but they said they haven't found anything. I'm completely stuck and don't know what to do.",
  "context": "Your close friend calls you sounding stressed and frustrated.",
  "missionType": "situationReact"
}

Respond only with valid JSON.`;
    }

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
            maxOutputTokens: 500,
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
        statement: parsedData.statement || (missionData.question || missionData.situation || 'Default statement'),
        context: parsedData.context || 'You are having a conversation about this topic.',
        missionType: parsedData.missionType || missionData.subType
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      
      // Fallback response based on mission type
      if (missionData.subType === 'agreeDisagree') {
        return {
          statement: missionData.question || 'This is a topic for discussion.',
          context: 'You are having a discussion with friends about this topic.',
          missionType: 'agreeDisagree'
        };
      } else {
        return {
          statement: `Someone is telling you about: ${missionData.situation}. You need to ${missionData.task}.`,
          context: 'A friend or colleague is talking to you about their situation.',
          missionType: 'situationReact'
        };
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}