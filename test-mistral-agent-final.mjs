// Final test script for Mistral Agent implementation
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

async function testMistralAgentFinal() {
  console.log('Testing final Mistral Agent implementation...');
  
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
  
  // Create a function that mimics our implementation
  async function useMistralAgent(messages) {
    console.log('Using Mistral Agent with ID:', agentId);
    
    try {
      const response = await mistral.agents.complete({
        agentId: agentId,
        messages: messages
      });
      
      let content = '';
      if (response.choices && response.choices[0]?.message?.content) {
        const messageContent = response.choices[0].message.content;
        if (typeof messageContent === 'string') {
          content = messageContent;
          console.log('Raw response preview:', content.substring(0, 100) + '...');
        } else {
          console.log('Received structured content instead of string');
          content = JSON.stringify(messageContent);
        }
      }
      
      return content || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Error with Mistral agent:', error);
      throw error;
    }
  }
  
  try {
    console.log('Testing with system message and user message...');
    
    const messages = [
      {
        role: "system",
        content: "You are a helpful language tutor specializing in English language."
      },
      {
        role: "user",
        content: userPrompt
      }
    ];
    
    const content = await useMistralAgent(messages);
    
    console.log('\nFinal response:');
    console.log(content);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMistralAgentFinal(); 