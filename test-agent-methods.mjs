// Test script to discover Mistral agent methods
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistralAgentMethods() {
  console.log('Testing Mistral Agent methods...');
  
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set.');
    process.exit(1);
  }
  
  // Initialize Mistral client
  const mistral = new Mistral({
    apiKey
  });
  
  // Log available methods and properties on mistral
  console.log('Mistral object keys:', Object.keys(mistral));
  
  // Check if agents property exists
  if (mistral.agents) {
    console.log('Mistral agents property exists');
    console.log('Mistral agents object keys:', Object.keys(mistral.agents));
    
    // Check for specific methods
    if (typeof mistral.agents.chat === 'function') {
      console.log('mistral.agents.chat exists as a function');
    } else {
      console.log('mistral.agents.chat does not exist as a function');
    }
    
    if (typeof mistral.agents.send === 'function') {
      console.log('mistral.agents.send exists as a function');
    } else {
      console.log('mistral.agents.send does not exist as a function');
    }
    
    if (typeof mistral.agents.complete === 'function') {
      console.log('mistral.agents.complete exists as a function');
    } else {
      console.log('mistral.agents.complete does not exist as a function');
    }
  } else {
    console.log('Mistral agents property does not exist');
  }

  // Test using fetch directly to the Mistral API
  console.log('\nTesting direct fetch to Mistral API for agents endpoint...');
  try {
    const agentId = "ag:7fe871ed:20250409:snapwort:7c2cd028";
    const response = await fetch('https://api.mistral.ai/v1/agents/' + agentId + '/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "What is the definition of 'ephemeral'?"
          }
        ]
      })
    });
    
    const result = await response.json();
    console.log('Direct API response status:', response.status);
    console.log('Direct API response:', result);
  } catch (error) {
    console.error('Error with direct API call:', error);
  }
}

testMistralAgentMethods(); 