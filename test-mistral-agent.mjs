// Simple test for Mistral Agent API
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistralAgent() {
  console.log('Testing Mistral Agent API...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    process.exit(1);
  }
  
  // Initialize Mistral client
  const mistral = new Mistral({
    apiKey
  });
  
  const agentId = "ag:7fe871ed:20250409:snapwort:7c2cd028";
  const userPrompt = "What is the definition of 'ephemeral'?";
  
  try {
    console.log('Sending request to Mistral Agent API...');
    console.log('Agent ID:', agentId);
    console.log('Prompt:', userPrompt);
    
    // Log available methods on mistral.agents for debugging
    console.log('Available methods on mistral.agents:', Object.getOwnPropertyNames(mistral.agents));
    
    // Check if mistral.agents is defined
    if (!mistral.agents) {
      console.error('mistral.agents is not defined in this SDK version');
      return;
    }
    
    // Try different methods that might exist
    try {
      console.log("Trying 'send' method");
      const response = await mistral.agents.send({
        agentId: agentId,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      });
      console.log('Response:', response);
    } catch (e) {
      console.error("Error with 'send' method:", e.message);
    }
    
    try {
      console.log("Trying 'complete' method");
      const response = await mistral.agents.complete({
        agentId: agentId,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      });
      console.log('Response:', response);
    } catch (e) {
      console.error("Error with 'complete' method:", e.message);
    }
    
    try {
      console.log("Trying direct chat with agentId as model");
      const response = await mistral.chat.complete({
        model: agentId,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        maxTokens: 500
      });
      console.log('Response:', response);
    } catch (e) {
      console.error("Error with direct agent as model:", e.message);
    }
    
  } catch (error) {
    console.error('Error calling Mistral API:', error);
  }
}

testMistralAgent(); 