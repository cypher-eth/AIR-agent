import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript, audioBlob } = await request.json();

    if ((!transcript || typeof transcript !== 'string') && !audioBlob) {
      return NextResponse.json(
        { error: 'Transcript or audioBlob is required' },
        { status: 400 }
      );
    }

    // Get n8n workflow URL from environment variables
    const n8nWorkflowUrl = process.env.N8N_WORKFLOW_URL;
    
    if (!n8nWorkflowUrl) {
      console.error('N8N_WORKFLOW_URL environment variable is not set');
      return NextResponse.json(
        { error: 'N8N workflow URL not configured' },
        { status: 500 }
      );
    }

    // Prepare payload for n8n workflow
    const n8nPayload = {
      transcript,
      timestamp: new Date().toISOString(),
      sessionId: request.headers.get('x-session-id') || 'default',
      userAgent: request.headers.get('user-agent'),
      // Include audio data if provided (base64 encoded)
      audioData: audioBlob ? audioBlob : null,
    };

    console.log('Sending to n8n workflow:', {
      url: n8nWorkflowUrl,
      payload: { ...n8nPayload, audioData: audioBlob ? '[BASE64_AUDIO_DATA]' : null }
    });

    // Call n8n workflow
    const n8nResponse = await fetch(n8nWorkflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Support-WebApp/1.0',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      console.error('N8N workflow error:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
      });
      
      // Fallback to local processing if n8n fails
      return handleLocalProcessing(transcript);
    }

    const n8nResult = await n8nResponse.json();
    console.log('N8N workflow response:', n8nResult);

    // Return the n8n workflow response
    return NextResponse.json({
      responseText: n8nResult.responseText || n8nResult.message || 'No response from AI',
      responseType: n8nResult.responseType || 'info',
      responseAudioUrl: n8nResult.responseAudioUrl || null,
      metadata: n8nResult.metadata || {},
    });

  } catch (error) {
    console.error('Error processing voice input:', error);
    
    // Fallback to local processing if n8n is unavailable
    try {
      const { transcript } = await request.json();
      return handleLocalProcessing(transcript);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

// Fallback local processing function
function handleLocalProcessing(transcript: string) {
  const processedTranscript = transcript.toLowerCase().trim();
  
  let responseText = '';
  let responseType: 'info' | 'quiz' | 'correct' = 'info';

  // Simple quiz logic - check for common capital city answers
  if (processedTranscript.includes('paris') && processedTranscript.includes('france')) {
    responseText = 'Correct! Paris is indeed the capital of France. Well done!';
    responseType = 'correct';
  } else if (processedTranscript.includes('london') && processedTranscript.includes('england')) {
    responseText = 'Correct! London is the capital of England. Excellent!';
    responseType = 'correct';
  } else if (processedTranscript.includes('tokyo') && processedTranscript.includes('japan')) {
    responseText = 'Correct! Tokyo is the capital of Japan. Great job!';
    responseType = 'correct';
  } else if (processedTranscript.includes('capital')) {
    responseText = 'Let me ask you a geography question: What is the capital of France?';
    responseType = 'quiz';
  } else if (processedTranscript.includes('hello') || processedTranscript.includes('hi')) {
    responseText = 'Hello! I\'m your AI assistant. I can help you with various questions. Try asking me about capital cities!';
    responseType = 'info';
  } else if (processedTranscript.includes('help')) {
    responseText = 'I can help you learn about geography, answer questions, and test your knowledge. Ask me about capital cities to get started!';
    responseType = 'info';
  } else {
    responseText = 'That\'s interesting! Let me ask you a question: What is the capital of France?';
    responseType = 'quiz';
  }

  return NextResponse.json({
    responseText,
    responseType,
    metadata: { source: 'local-fallback' },
  });
} 