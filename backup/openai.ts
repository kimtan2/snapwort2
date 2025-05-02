import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { Mistral } from '@mistralai/mistralai';
import type { ChatCompletionMessageParam } from 'openai/resources';

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
const MISTRAL_MODEL = "mistral-small-2501"; // Primary model - mistral-small-latest is the same as mistral-small-3.1
const FALLBACK_MISTRAL_MODEL = "open-mistral-7b"; // Fallback model

// Mistral Agent ID
const MISTRAL_AGENT_ID = "ag:7fe871ed:20250409:snapwort:7c2cd028"; // User's custom Mistral agent
console.log('Configured Mistral Agent ID:', MISTRAL_AGENT_ID);

// Determine if we should use a specific model
const shouldUseMistralAgent = () => DEFAULT_MODEL_PROVIDER === 'mistral-agent';
const shouldUseGroq = () => DEFAULT_MODEL_PROVIDER === 'groq';
const shouldUseOpenAI = () => DEFAULT_MODEL_PROVIDER === 'openai';

// Function to use Mistral agent instead of a model
async function useMistralAgent(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, 
  options: { temperature?: number; maxTokens?: number } = {}
) {
  console.log('Using Mistral Agent with ID:', MISTRAL_AGENT_ID);
  
  try {
    // Use the regular chat.complete endpoint with the agent ID as the model
    const response = await mistral.chat.complete({
      model: MISTRAL_AGENT_ID,
      messages: messages as any, // Type assertion to bypass incompatible types
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 800
    });
    
    let content = '';
    if (response.choices && response.choices[0]?.message?.content) {
      const messageContent = response.choices[0].message.content;
      if (typeof messageContent === 'string') {
        content = messageContent;
      } else {
        content = JSON.stringify(messageContent);
      }
    }
    
    return content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error with Mistral agent:', error);
    throw error;
  }
}

export async function getFollowUp(
  question: string, 
  language: 'en' | 'de', 
  previousContext?: { question: string; answer: string }[]
) {
  type Message = {
    role: 'system' | 'user' | 'assistant';
    content: string;
  };

  // Build the conversation history
  const messages: Message[] = [
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
        const content = await useMistralAgent(messages, { temperature: 0.7, maxTokens: 800 });
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
        // Manually reconstruct messages for GROQ to avoid type issues
        const groqMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const response = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages as any, // Type assertion to bypass incompatible types
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

export async function getLanguageAssistance(query: string, language: 'en' | 'de') {
  // First request: Get the main answer
  const answerPrompt = 
    language === 'en' ? 
    `Analyze this language query: "${query}" in English.

    As a language learning assistant, carefully analyze the user's request: If they ask for definitions: provide the part of speech, list meanings of that word/expression/idiom/collocation. ALWAYS provide examples to illustrate their usage based on the meaning. Also say, in which context the word usually is used. 
    Users may also ask any other question (of course it is related to language learning, and specifically to the language the user learns: English).
    Or the user may ask questions like: how to say x in English -> in this case help them how to say that in the targeted language.

    Formatting: use markdown

    Please be precise, keep your response not so long!. Do not show your thoughts, inner reasoning chain etc. Just response. Simple task! Be like language teacher: directly response to the user itself! Also do not end your response with a question!
    ` : 
    language === 'de' ? 
    `Analysiere diese Sprachanfrage: "${query}" auf Deutsch.

    Als Sprachlernassistent analysiere sorgfältig die Anfrage des Benutzers: Wenn nach Definitionen gefragt wird: gib die Wortart an, liste die Bedeutungen dieses Wortes/Ausdrucks/Redewendung/Kollokation auf. Gib IMMER Beispiele, um deren Verwendung basierend auf der Bedeutung zu veranschaulichen. Sage auch, in welchem Kontext das Wort üblicherweise verwendet wird.
    Benutzer können auch andere Fragen stellen (natürlich bezieht es sich auf Sprachenlernen und speziell auf die Sprache, die der Benutzer lernt: Deutsch).
    Oder der Benutzer fragt vielleicht: wie sagt man x auf Deutsch -> in diesem Fall hilf ihm, wie man das in der Zielsprache sagt.

    Formatierung: verwende Markdown

    Bitte sei präzise, halte deine Antwort nicht zu lang! Zeige keine Gedanken, innere Argumentationskette usw. Nur die Antwort. Einfache Aufgabe! Sei wie ein Sprachlehrer: antworte direkt dem Benutzer selbst! Beende deine Antwort auch nicht mit einer Frage!
    ` :
    // Default for any other language that might be added in the future
    `Analyze this language query: "${query}" in the target language.

    As a language learning assistant, carefully analyze the user's request: If they ask for definitions: provide the part of speech, list meanings of that word/expression/idiom/collocation. ALWAYS provide examples to illustrate their usage based on the meaning. Also say, in which context the word usually is used. 
    Users may also ask any other question (of course it is related to language learning, and specifically to the language the user learns).
    Or the user may ask questions like: how to say x in the target language -> in this case help them how to say that in the targeted language.

    Formatting: use markdown

    Please be precise, keep your response not so long!. Do not show your thoughts, inner reasoning chain etc. Just response. Simple task! Be like language teacher: directly response to the user itself! Also do not end your response with a question!
    `;

  let answer = '';
  let modelUsed = 'none';
  const systemPrompt = "You are a precise language assistant that can distinguish between definition requests and specific questions. For definitions, you provide clear, structured information. For specific questions, you DIRECTLY address the exact question asked, not just provide general information about the term. If asked in German response in German, if asked in English response in English.";
  
  // Messages for the answer request
  const answerMessages = [
    {
      role: "system" as const,
      content: systemPrompt
    },
    {
      role: "user" as const,
      content: answerPrompt
    }
  ];
  
  try {
    if (shouldUseMistralAgent()) {
      try {
        console.log('Attempting to use Mistral Agent for language assistance...');
        answer = await useMistralAgent(answerMessages, { temperature: 0.5, maxTokens: 600 });
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
        // Manually reconstruct messages for GROQ to avoid type issues
        const groqMessages = answerMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const answerResponse = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages as any, // Type assertion to bypass incompatible types
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
  const metaMessages = [
    {
      role: "system" as const,
      content: "You extract the key information from language queries and generate helpful follow-up questions for language learners. Respond using valid JSON format only."
    },
    {
      role: "user" as const,
      content: metaPrompt
    }
  ];

  try {
    if (shouldUseMistralAgent()) {
      try {
        console.log('Attempting to use Mistral Agent for meta information...');
        const metaContent = await useMistralAgent(metaMessages, { temperature: 0.4, maxTokens: 350 });
        console.log('Mistral agent meta response received:', metaContent.substring(0, 50) + '...');
        try {
          const metaData = JSON.parse(metaContent);
          title = metaData.title || extractTitleFromQuery(query);
          suggestions = metaData.suggestions || generateDefaultSuggestions(query, language);
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
        // Manually reconstruct messages for GROQ
        const groqMessages = metaMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        const metaResponse = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages as any, // Type assertion to bypass incompatible types
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

