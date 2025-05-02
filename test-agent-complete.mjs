// Test script to try Mistral agents.complete method
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistralAgentComplete() {
  console.log('Testing Mistral Agent complete method...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    process.exit(1);
  }
  
  // Initialize Mistral client
  const mistral = new Mistral({
    apiKey
  });
  
  // Print mistral.agents.complete function definition
  console.log('Mistral agents.complete function:');
  console.log(mistral.agents.complete.toString().slice(0, 1000));
  
  const agentId = "ag:7fe871ed:20250409:snapwort:7c2cd028";
  const userPrompt = "What is the definition of 'ephemeral'?";
  
  try {
    console.log('Sending request to Mistral Agent API using agents.complete...');
    console.log('Agent ID:', agentId);
    console.log('Prompt:', userPrompt);
    
    // Using the agents.complete method with only documented parameters
    const response = await mistral.agents.complete({
      agentId: agentId,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });
    
    console.log('\nMistral agent response:');
    console.log(response.choices[0].message.content);
    console.log('\nFull response object:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testMistralAgentComplete(); 