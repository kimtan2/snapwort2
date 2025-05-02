// Simple test for Mistral API with the fixed approach
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistralFix() {
  console.log('Testing Mistral API with the fixed approach...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    process.exit(1);
  }
  
  // Initialize Mistral client
  const mistral = new Mistral({
    apiKey
  });
  
  const model = "mistral-small-2501";
  const userPrompt = "What is the definition of 'ephemeral'?";
  
  try {
    console.log('Sending request to Mistral API using chat.complete...');
    console.log('Model:', model);
    console.log('Prompt:', userPrompt);
    
    // Using the correct approach: chat.complete with model
    const response = await mistral.chat.complete({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful language tutor specializing in English language."
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      maxTokens: 500
    });
    
    console.log('\nMistral response:');
    console.log(response.choices[0].message.content);
    console.log('\nFull response object:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testMistralFix(); 