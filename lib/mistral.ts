import { Mistral } from '@mistralai/mistralai';

// Initialize the Mistral client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
});

// Define the new word task interface
interface WordTask {
  language: string;
  question: string;
  meantWord: string;
  alternativeWords: string[];
  example: string;
}

// The agent ID for the Mistral agent
const AGENT_ID = "ag:7fe871ed:20250410:aktiverwortschatz:04e94ebd";

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text: string): string {
  // Check if response is wrapped in markdown code blocks
  const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
  const match = text.match(jsonRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no markdown code blocks found, return the original text
  return text;
}

export async function generateTasks(count: number, previousTasks: string[], language: 'en' | 'de' = 'en') {
  try {
    console.log(`Calling Mistral agent with language: ${language}`);
    
    // Create messages for the Mistral agent with proper typing
    const messages = [
      {
        role: "user" as const,
        content: language // Send only the language code to the agent
      }
    ];
    
    // Call the Mistral agent
    console.log(`Using agent ID: ${AGENT_ID}`);
    const response = await mistral.agents.complete({
      agentId: AGENT_ID,
      messages: messages
    });
    
    // Extract the response content
    let content = '';
    if (response.choices && response.choices[0]?.message?.content) {
      const messageContent = response.choices[0].message.content;
      if (typeof messageContent === 'string') {
        content = messageContent;
      } else {
        // Handle case where content might be an array of content chunks
        content = JSON.stringify(messageContent);
      }
    }
    
    if (!content) {
      throw new Error('Empty response from Mistral agent');
    }
    
    console.log(`Raw content from Mistral agent (first 100 chars): ${content.substring(0, 100)}...`);
    
    try {
      // Extract JSON from markdown if needed and parse it
      const jsonContent = extractJsonFromMarkdown(content);
      console.log("Extracted JSON content:", jsonContent);
      
      // Add a fallback for English when response is invalid
      try {
        const parsedData: WordTask = JSON.parse(jsonContent);
        
        // Transform the received data into the required task format
        const timestamp = Date.now();
        const task = {
          id: `task_${timestamp}_${Math.floor(Math.random() * 1000)}`,
          type: 'free_response',
          question: parsedData.question,
          answer: parsedData.meantWord,
          alternativeWords: parsedData.alternativeWords,
          example: parsedData.example,
          points: 15
        };
        
        return [task];
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        
        // Fallback for English if we can't parse the JSON
        if (language === 'en') {
          console.log("Using fallback for English");
          const timestamp = Date.now();
          return [{
            id: `task_${timestamp}_${Math.floor(Math.random() * 1000)}`,
            type: 'free_response',
            question: "How would you use the phrase 'to make progress' in a sentence about learning a new skill?",
            answer: "make progress",
            alternativeWords: ["advance", "improve", "develop", "move forward"],
            example: "I need to make progress with my Spanish before my trip to Mexico next month.",
            points: 15
          }];
        }
        
        // Re-throw for German
        throw parseError;
      }
    } catch (e: unknown) {
      console.error("Failed to parse Mistral agent response:", e);
      console.log("Raw response:", content);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      throw new Error(`Failed to parse Mistral agent response: ${errorMessage}. Raw response: ${content}`);
    }
  } catch (error) {
    console.error("Error calling Mistral agent:", error);
    throw error;
  }
}

export async function checkAnswer(answer: string, correctAnswer: string, question: string = '') {
  try {
    console.log(`Checking answer using Mistral Small model`);
    
    // Create messages for the Mistral model
    const messages = [
      {
        role: "system" as const,
        content: "You are a language learning assistant. Evaluate the student's response and provide helpful, encouraging feedback."
      },
      {
        role: "user" as const,
        content: `Question: "${question}"\n\nStudent's answer: "${answer}"\n\nCorrect/expected word: "${correctAnswer}"\n\nPlease provide detailed feedback on the student's answer. Consider whether they used the correct word or similar alternatives. Focus on the meaning rather than minor grammar mistakes. Be encouraging even if the answer isn't perfect.`
      }
    ];
    
    // Call the Mistral small model
    const response = await mistral.chat.complete({
      model: "mistral-small",
      messages: messages,
      temperature: 0.7,
      maxTokens: 300
    });
    
    // Extract the response content
    let feedback = 'No feedback available.';
    if (response && response.choices && response.choices[0]?.message?.content) {
      const messageContent = response.choices[0].message.content;
      if (typeof messageContent === 'string') {
        feedback = messageContent;
      } else {
        // Handle case where content might be an array of content chunks
        feedback = JSON.stringify(messageContent);
      }
    }
    
    // Simple check if the answer contains the correct word
    const isCorrect = answer.trim().toLowerCase().includes(correctAnswer.trim().toLowerCase());
    
    return {
      isCorrect,
      feedback,
      score: isCorrect ? 5 : 2
    };
  } catch (error) {
    console.error("Error checking answer with Mistral Small:", error);
    throw error;
  }
} 