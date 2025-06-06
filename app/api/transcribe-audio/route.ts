import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🎤 Transcribe API called');
  
  try {
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not found');
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.'
      }, { status: 500 });
    }
    
    console.log('✅ OpenAI API key found');
    
    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error('❌ Failed to parse form data:', err);
      return NextResponse.json({ 
        error: 'Failed to parse form data'
      }, { status: 400 });
    }
    
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('❌ No audio file provided');
      return NextResponse.json({ 
        error: 'Audio file is required'
      }, { status: 400 });
    }
    
    console.log(`📁 Audio file received: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`);
    
    // Check file size (OpenAI has a 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      console.error('❌ File too large');
      return NextResponse.json({ 
        error: 'Audio file is too large. Maximum size is 25MB.'
      }, { status: 400 });
    }
    
    try {
      const transcription = await transcribeWithWhisper(audioFile);
      console.log('✅ Transcription successful');
      return NextResponse.json({ transcription });
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ 
        error: `Transcription failed: ${errorMessage}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }, { status: 500 });
  }
}

async function transcribeWithWhisper(audioFile: File): Promise<string> {
  console.log('🔄 Starting Whisper transcription...');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Create form data for OpenAI API
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json'); // Changed to json for better error handling

    console.log('📡 Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log(`📡 OpenAI response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('OpenAI error details:', errorData);
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      } catch {
        const errorText = await response.text();
        console.error('OpenAI error text:', errorText);
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ OpenAI response received');
    
    const transcription = result.text;
    
    if (!transcription || transcription.trim() === '') {
      throw new Error('Empty transcription received from OpenAI');
    }

    console.log(`📝 Transcription: "${transcription.substring(0, 100)}..."`);
    return transcription.trim();
  } catch (error) {
    console.error("💥 Whisper API error:", error);
    throw error;
  }
}