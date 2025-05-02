export async function speakText(text: string, language: 'en' | 'de') {
  try {
    // Create a new SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set the language based on the word's language
    utterance.lang = language === 'en' ? 'en-US' : 'de-DE';
    
    // Set voice properties
    utterance.rate = 0.9; // Slightly slower than normal
    utterance.pitch = 1.0; // Normal pitch
    
    // Get available voices and set the appropriate one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = {
      'en': ['en-US', 'en-GB'],
      'de': ['de-DE']
    };
    
    // Find the best matching voice for the language
    const voice = voices.find(v => 
      preferredVoices[language].some(lang => v.lang.startsWith(lang))
    );
    
    if (voice) {
      utterance.voice = voice;
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
    
    return true;
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return false;
  }
} 