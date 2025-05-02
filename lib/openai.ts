import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';

// Manual model selection configuration
// Options: 'mistral-agent' (default), 'openai', 'groq'
const DEFAULT_MODEL_PROVIDER: string = 'mistral-agent';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize the GROQ client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

// Model for Mistral
const MISTRAL_MODEL = "a"; // Primary model - mistral-small-latest is the same as mistral-small-3.1

// Mistral Agent ID
const MISTRAL_AGENT_ID = "ag:7fe871ed:20250409:snapwort:7c2cd028"; // User's custom Mistral agent
console.log('Configured Mistral Agent ID:', MISTRAL_AGENT_ID);

// Determine if we should use a specific model
const shouldUseMistralAgent = () => DEFAULT_MODEL_PROVIDER === 'mistral-agent';
const shouldUseGroq = () => DEFAULT_MODEL_PROVIDER === 'groq';

// Define message types to avoid using any
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Function to use Mistral agent instead of a model - renamed from useMistralAgent to callMistralAgent
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
    if (shouldUseMistralAgent()) {
      try {
        const content = await callMistralAgent(messages, { temperature: 0.7, maxTokens: 800 });
        return {
          answer: content,
          modelUsed: 'mistral-agent'
        };
      } catch (error) {
        console.error('Mistral Agent Error:', error);
        // Fall back to the next provider
        console.log('Falling back to next provider...');
      }
    }
    
    // Try GROQ if it's the default or if mistral-agent failed
    const useGroq = shouldUseGroq() || shouldUseMistralAgent();
                   
    if (useGroq) {
      try {
        // Create properly typed messages for GROQ
        const groqMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const response = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 800
        });

        return {
          answer: response.choices[0].message.content || "I couldn't generate a response. Please try again.",
          modelUsed: 'groq'
        };
      } catch (error) {
        console.error('GROQ API Error:', error);
        // Fallback to OpenAI if GROQ fails
        console.log('Falling back to OpenAI...');
      }
    }
    
    // Default fallback to OpenAI
    // Manually reconstruct messages for OpenAI
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 800
    });

    return {
      answer: response.choices[0].message.content || "I couldn't generate a response. Please try again.",
      modelUsed: 'openai'
    };
  } catch (error) {
    console.error('All models failed:', error);
    return {
      answer: "Sorry, there was an error with all available language models. Please try again later.",
      modelUsed: 'none'
    };
  }
}

export async function getLanguageAssistance(query: string, language: 'en' | 'de', queryType: 'definition' | 'check' | 'ask' = 'definition') {
  // First request: Get the main answer
  let answerPrompt = '';
  
  // Customize the prompt based on the queryType
  if (queryType === 'definition') {
    answerPrompt = language === 'en' ? 
      `Provide a precise, clear definition for: "${query}" in English. Include part of speech, meaning, usage examples, and related forms if relevant.` : 
      `Gib eine präzise, klare Definition für: "${query}" auf Deutsch. Füge Wortart, Bedeutung, Verwendungsbeispiele und verwandte Formen an, wenn relevant.`;
  } 
  else if (queryType === 'check') {
    answerPrompt = language === 'en' ? 
      `Check this phrase or sentence for correctness and naturalness: "${query}" in English. Point out any errors, awkward phrasings, or unnatural expressions. Suggest improvements.` : 
      `Überprüfe diesen Satz oder diese Phrase auf Korrektheit und Natürlichkeit: "${query}" auf Deutsch. Zeige Fehler, ungeschickte Formulierungen oder unnatürliche Ausdrücke auf. Schlage Verbesserungen vor.`;
  }
  else if (queryType === 'ask') {
    answerPrompt = language === 'en' ? 
      `Answer this language-related question: "${query}" in English. Provide a comprehensive explanation tailored specifically to this question.` : 
      `Beantworte diese sprachbezogene Frage: "${query}" auf Deutsch. Gib eine umfassende Erklärung, die speziell auf diese Frage zugeschnitten ist.`;
  }
  else {
    // Default fallback
    answerPrompt = language === 'en' ? 
      `Analyze this language query: "${query}" in English.` : 
      `Analysiere diese Sprachanfrage: "${query}" auf Deutsch.`;
  }

  let answer = '';
  let modelUsed = 'none';
  
  // Adjust system prompt based on query type
  let systemPrompt = '';
  
  if (queryType === 'definition') {
    systemPrompt = "You are a precise language assistant specialized in providing clear definitions. Format your response with markdown, focusing on the exact meaning, usage, and examples of the term.";
  } 
  else if (queryType === 'check') {
    systemPrompt = "You are a language checker that identifies errors, awkward phrasings, and unnatural expressions in text. Provide specific corrections and improvements. Format your response with markdown.";
  }
  else if (queryType === 'ask') {
    systemPrompt = "You are a language expert that answers specific questions about language usage, grammar, vocabulary, and linguistics. Address the exact question directly and comprehensively. Format your response with markdown.";
  }
  else {
    systemPrompt = "You are a precise language assistant that can distinguish between definition requests and specific questions. For definitions, you provide clear, structured information. For specific questions, you DIRECTLY address the exact question asked, not just provide general information about the term. If asked in German response in German, if asked in English response in English.";
  }
  
  // Messages for the answer request
  const answerMessages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: answerPrompt
    }
  ];
  
  try {
    if (shouldUseMistralAgent()) {
      try {
        console.log('Attempting to use Mistral Agent for language assistance...');
        answer = await callMistralAgent(answerMessages, { temperature: 0.5, maxTokens: 600 });
        console.log('Mistral Agent response received successfully:', answer.substring(0, 50) + '...');
        modelUsed = 'mistral-agent';
      } catch (error) {
        console.error('Mistral Agent Error for language assistance:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack trace:', error.stack);
        }
        // Fall back to the next provider
        console.log('Falling back to next provider...');
      }
    }
    
    // Try GROQ if it's the default or if mistral-agent failed and didn't provide an answer
    const useGroq = !answer && (shouldUseGroq() || shouldUseMistralAgent());
                              
    if (useGroq) {
      try {
        // Create properly typed messages for GROQ
        const groqMessages = answerMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const answerResponse = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages,
          temperature: 0.5,
          max_tokens: 600
        });
        
        answer = answerResponse.choices[0].message.content || 'No information found.';
        modelUsed = 'groq';
      } catch (error) {
        console.error('GROQ API Error:', error);
        console.log('Falling back to OpenAI...');
      }
    }
    
    if (!answer) {
      // Reconstruct messages for OpenAI
      const openAIMessages = answerMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const answerResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        temperature: 0.5,
        max_tokens: 600
      });
      
      answer = answerResponse.choices[0].message.content || 'No information found.';
      modelUsed = 'openai';
    }
  } catch (error) {
    console.error('All models failed for answer:', error);
    answer = 'Sorry, there was an error processing your request.';
  }

  // Second request: Get the title and suggestions
  const metaPrompt = `Based on this language query: "${query}" in ${language === 'en' ? 'English' : 'German'}, provide:
  1. A concise title that represents the main word, idiom, or expression being discussed (not the question itself)
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
    if (shouldUseMistralAgent()) {
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
    } else if (shouldUseGroq()) {
      try {
        // Create properly typed messages for GROQ
        const groqMessages = metaMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const metaResponse = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages,
          temperature: 0.4,
          max_tokens: 350,
          response_format: { type: "json_object" }
        });
        
        const metaContent = metaResponse.choices[0].message.content || '{"title": "", "suggestions": []}';
        try {
          const metaData = JSON.parse(metaContent);
          title = metaData.title || extractTitleFromQuery(query);
          suggestions = metaData.suggestions || generateDefaultSuggestions(query, language);
        } catch (jsonError) {
          console.error('Error parsing GROQ JSON:', jsonError);
          title = extractTitleFromQuery(query);
          suggestions = generateDefaultSuggestions(query, language);
        }
      } catch (error) {
        console.error('GROQ API Error for meta:', error);
        title = extractTitleFromQuery(query);
        suggestions = generateDefaultSuggestions(query, language);
      }
    } else {
      try {
        // Reconstruct messages for OpenAI
        const openAIMessages = metaMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const metaResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openAIMessages,
          temperature: 0.4,
          max_tokens: 350,
          response_format: { type: "json_object" }
        });
        
        const metaContent = metaResponse.choices[0].message.content || '{"title": "", "suggestions": []}';
        try {
          const metaData = JSON.parse(metaContent);
          title = metaData.title || extractTitleFromQuery(query);
          suggestions = metaData.suggestions || generateDefaultSuggestions(query, language);
        } catch (jsonError) {
          console.error('Error parsing OpenAI JSON:', jsonError);
          title = extractTitleFromQuery(query);
          suggestions = generateDefaultSuggestions(query, language);
        }
      } catch (error) {
        console.error('OpenAI API Error for meta:', error);
        title = extractTitleFromQuery(query);
        suggestions = generateDefaultSuggestions(query, language);
      }
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

