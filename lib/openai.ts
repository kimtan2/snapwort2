import { Mistral } from '@mistralai/mistralai';

// Mistral Agent ID
const MISTRAL_AGENT_ID = "ag:7fe871ed:20250409:snapwort:7c2cd028"; // User's custom Mistral agent
console.log('Configured Mistral Agent ID:', MISTRAL_AGENT_ID);

// Model for Mistral
const MISTRAL_MODEL = "mistral-small-latest"; 

// Initialize the Mistral client
let mistral: Mistral;
try {
  // Check if the API key is set
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.warn('MISTRAL_API_KEY is not set. Mistral models will not be available.');
    throw new Error('Mistral API key is not set');
  }
  
  mistral = new Mistral({
    apiKey
  });
  console.log('Mistral client initialized successfully');
} catch (error) {
  console.error('Error initializing Mistral client:', error);
  // Create a dummy client that will throw meaningful errors when used
  mistral = new Mistral({
    apiKey: 'dummy-key'
  });
}

// Define message types to avoid using any
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Function to use Mistral agent
async function callMistralAgent(
  messages: Array<ChatMessage>, 
  options: { temperature?: number; maxTokens?: number } = {}
) {
  console.log('Using Mistral Agent with ID:', MISTRAL_AGENT_ID);
  
  try {
    // Use the agents.complete method - note that it doesn't support temperature or maxTokens
    const response = await mistral.agents.complete({
      agentId: MISTRAL_AGENT_ID,
      messages: messages
    });
    
    let content = '';
    if (response.choices && response.choices[0]?.message?.content) {
      const messageContent = response.choices[0].message.content;
      if (typeof messageContent === 'string') {
        content = messageContent;
        console.log('Raw response preview:', content.substring(0, 100) + '...');
      } else {
        // For ContentChunk[] type
        console.log('Received structured content instead of string');
        content = JSON.stringify(messageContent);
      }
    }
    
    return content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error with Mistral agent:', error);
    
    // Fall back to using a regular model
    try {
      console.log('Falling back to regular Mistral model:', MISTRAL_MODEL);
      const fallbackResponse = await mistral.chat.complete({
        model: MISTRAL_MODEL,
        messages: messages,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 800
      });
      
      let fallbackContent = '';
      if (fallbackResponse.choices && fallbackResponse.choices[0]?.message?.content) {
        const messageContent = fallbackResponse.choices[0].message.content;
        if (typeof messageContent === 'string') {
          fallbackContent = messageContent;
        } else {
          fallbackContent = JSON.stringify(messageContent);
        }
      }
      
      return fallbackContent || "I couldn't generate a response with the fallback model. Please try again.";
    } catch (fallbackError) {
      console.error('Error with fallback Mistral model:', fallbackError);
      throw error; // Throw the original error
    }
  }
}

export async function getFollowUp(
  question: string, 
  language: 'en' | 'de', 
  previousContext?: { question: string; answer: string }[]
) {
  // Build the conversation history
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a helpful language tutor specializing in ${language === 'en' ? 'English' : 'German'} language. 
      Provide educational, clear, and comprehensive answers to language questions. Format your response with markdown.`
    }
  ];

  // Add previous conversation context if available
  if (previousContext && previousContext.length > 0) {
    for (const context of previousContext) {
      messages.push({
        role: 'user',
        content: context.question
      });
      messages.push({
        role: 'assistant',
        content: context.answer
      });
    }
  }

  // Add the current question
  messages.push({
    role: 'user',
    content: question
  });

  try {
    console.log('Sending follow-up question to Mistral Agent...');
    const response = await callMistralAgent(messages, { temperature: 0.7 });
    
    return {
      answer: response,
      modelUsed: 'Mistral Agent'
    };
  } catch (error) {
    console.error('Error with Mistral for follow-up:', error);
    return {
      answer: "I'm sorry, I couldn't process your question at this time. Please try again later.",
      modelUsed: 'Error - No response'
    };
  }
}

export async function getLanguageAssistance(query: string, language: 'en' | 'de', queryType: 'definition' | 'check' | 'ask' = 'definition') {
  console.log(`Getting ${queryType} assistance for: "${query}" in ${language}`);
  
  // Construct the prompt based on query type
  let prompt = '';
  if (queryType === 'definition') {
    prompt = `Define the ${language === 'en' ? 'English' : 'German'} word or phrase: "${query}". `;
    prompt += `Provide a clear definition, examples of usage, and any relevant grammatical information. `;
    if (language === 'de') {
      prompt += `For German words, include gender for nouns, conjugation patterns for verbs, and declension for adjectives where relevant. `;
    }
  } else if (queryType === 'check') {
    prompt = `Check if this ${language === 'en' ? 'English' : 'German'} text is correct: "${query}". `;
    prompt += `If there are errors, explain them and provide corrections. Consider grammar, spelling, word choice, and natural phrasing. `;
  } else { // 'ask'
    prompt = query;
  }
  
  // Add formatting instructions
  prompt += `Format your response using markdown for clarity. Be concise but thorough.`;
  
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a helpful language tutor specializing in ${language === 'en' ? 'English' : 'German'} language. 
      Provide educational, clear, and comprehensive answers to language questions. Format your response with markdown.`
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  
  let answer = '';
  let modelUsed = 'Mistral Agent';
  
  try {
    console.log('Sending to Mistral Agent...');
    answer = await callMistralAgent(messages, { temperature: 0.5 });
    console.log('Received response from Mistral Agent');
  } catch (error) {
    console.error('Error with Mistral Agent:', error);
    answer = `I'm sorry, I couldn't process your request at this time. Please try again later.`;
    modelUsed = 'Error - No response';
  }
  
  // Generate meta information (title and follow-up suggestions)
  const metaPrompt = `For the ${language === 'en' ? 'English' : 'German'} language query: "${query}"
  
  Please provide:
  1. A short title (1-3 words) that represents the main word, phrase, or concept being discussed.
  2. Four relevant language learning follow-up questions. They should refer to the request and be related to language learning, grammar, usage, idioms, expressions, etc.
  
  Return your response as a JSON object with these fields:
  - "title": The main word, idiom, or expression (keep it short and focused)
  - "suggestions": An array of exactly 4 relevant language learning follow-up questions`;

  let title = '';
  let suggestions: string[] = [];

  // Messages for meta information
  const metaMessages: ChatMessage[] = [
    {
      role: "system",
      content: "You extract the key information from language queries and generate helpful follow-up questions for language learners. Respond using valid JSON format only."
    },
    {
      role: "user",
      content: metaPrompt
    }
  ];

  try {
    try {
      console.log('Attempting to use Mistral Agent for meta information...');
      const metaContent = await callMistralAgent(metaMessages, { temperature: 0.4, maxTokens: 350 });
      console.log('Mistral agent meta response received:', metaContent.substring(0, 50) + '...');
      
      // Extract JSON from potential markdown response
      let jsonContent = metaContent;
      
      // Check if the response contains markdown code blocks with JSON
      const jsonBlockMatch = metaContent.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonContent = jsonBlockMatch[1];
        console.log('Extracted JSON from markdown code block');
      }
      
      try {
        const metaData = JSON.parse(jsonContent);
        title = metaData.title || extractTitleFromQuery(query);
        suggestions = Array.isArray(metaData.suggestions) ? metaData.suggestions : generateDefaultSuggestions(query, language);
      } catch (jsonError) {
        console.error('Error parsing Mistral JSON:', jsonError);
        title = extractTitleFromQuery(query);
        suggestions = generateDefaultSuggestions(query, language);
      }
    } catch (error) {
      console.error('Mistral Agent Error for meta:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // Fall back to default values
      title = extractTitleFromQuery(query);
      suggestions = generateDefaultSuggestions(query, language);
    }
  } catch (error) {
    console.error('All models failed for meta information:', error);
    title = extractTitleFromQuery(query);
    suggestions = generateDefaultSuggestions(query, language);
  }

  // Ensure exactly 4 suggestions
  while (suggestions.length < 4) {
    suggestions.push(`Tell me more about ${title}`);
  }
  suggestions = suggestions.slice(0, 4);

  // Combine the results into the final response
  const result = {
    title,
    answer,
    suggestions,
    modelUsed
  };
  
  return result;
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
