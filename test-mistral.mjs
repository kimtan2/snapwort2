// Simple test for Mistral API
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';
import fetch from 'node-fetch';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistral() {
  console.log('Testing Mistral API...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    process.exit(1);
  }
  
  // Initialize Mistral client
  const mistral = new Mistral({
    apiKey
  });
  
  const userPrompt = "What is the definition of 'ephemeral'?";
  
  try {
    console.log('Sending request to Mistral API...');
    console.log('Prompt:', userPrompt);
    
    const response = await mistral.chat.complete({
      model: "ag:7fe871ed:20250409:snapwort:7c2cd028",
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

// Direct fetch to API endpoint (alternative method)
async function testMistralDirectAPI() {
  console.log('Testing direct Mistral API call...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    return;
  }
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "ag:7fe871ed:20250409:snapwort:7c2cd028",
        messages: [
          {
            role: "system",
            content: "You are a helpful language tutor specializing in English language."
          },
          {
            role: "user",
            content: "What is the definition of 'ephemeral'?"
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    console.log('Direct API response:', data.choices[0].message.content);
  } catch (error) {
    console.error('Error with direct API call:', error);
  }
}

testMistral(); 