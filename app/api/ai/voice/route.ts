import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript, audioBlob } = await request.json();

    // Validate input - require either transcript or audioBlob
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
      transcript: transcript || '', // Ensure transcript is always a string
      timestamp: new Date().toISOString(),
      sessionId: request.headers.get('x-session-id') || 'default',
      userAgent: request.headers.get('user-agent'),
      audioData: audioBlob || null, // Include audio data if provided (base64 encoded)
    };

    console.log('Sending to n8n workflow:', {
      url: n8nWorkflowUrl,
      hasTranscript: !!transcript,
      hasAudioData: !!audioBlob,
      audioDataSize: audioBlob ? audioBlob.length : 0
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
      
      // Try to get error details from response
      try {
        const errorText = await n8nResponse.text();
        console.error('N8N error response body:', errorText);
      } catch (e) {
        console.error('Could not read error response body');
      }
      
      // Fallback to local processing if n8n fails
      return handleLocalProcessing(transcript || '');
    }

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      // Try to get the raw response
      const rawResponse = await n8nResponse.text();
      console.error('Raw n8n response:', rawResponse);
      
      // If it's a string, use it directly
      if (typeof rawResponse === 'string' && rawResponse.trim()) {
        return NextResponse.json({
          responseText: rawResponse,
          responseType: 'info',
          responseAudioUrl: null,
          metadata: {
            source: 'n8n-workflow-string-response',
            processedAt: new Date().toISOString(),
            hasAudioInput: !!audioBlob,
            hasTranscriptInput: !!transcript
          },
        });
      }
      
      // Fallback to local processing
      return handleLocalProcessing(transcript || '');
    }

    console.log('N8N workflow response received:', {
      hasResponseText: !!n8nResult.responseText,
      hasMessage: !!n8nResult.message,
      responseType: n8nResult.responseType,
      hasAudioUrl: !!n8nResult.responseAudioUrl
    });
    
    // Add detailed logging of the actual response
    console.log('Full n8n response:', JSON.stringify(n8nResult, null, 2));
    console.log('n8n response keys:', Object.keys(n8nResult));

    // Extract response text with proper fallback logic
    let responseText = '';
    if (n8nResult.responseText) {
      responseText = n8nResult.responseText;
    } else if (n8nResult.message) {
      responseText = n8nResult.message;
    } else if (n8nResult.text) {
      responseText = n8nResult.text;
    } else if (n8nResult.content) {
      responseText = n8nResult.content;
    } else if (n8nResult.answer) {
      responseText = n8nResult.answer;
    } else if (n8nResult.response) {
      responseText = n8nResult.response;
    } else if (typeof n8nResult === 'string') {
      responseText = n8nResult;
    } else {
      responseText = 'No response text received from AI';
    }

    // Return the n8n workflow response
    return NextResponse.json({
      responseText,
      responseType: n8nResult.responseType || 'info',
      responseAudioUrl: n8nResult.responseAudioUrl || null,
      metadata: {
        ...n8nResult.metadata,
        source: 'n8n-workflow',
        processedAt: new Date().toISOString(),
        hasAudioInput: !!audioBlob,
        hasTranscriptInput: !!transcript
      },
    });

  } catch (error) {
    console.error('Error processing voice input:', error);
    
    // Fallback to local processing if n8n is unavailable
    try {
      const { transcript } = await request.json();
      return handleLocalProcessing(transcript || '');
    } catch (fallbackError) {
      console.error('Fallback processing also failed:', fallbackError);
      return NextResponse.json(
        { 
          error: 'Internal server error',
          responseText: 'Sorry, I encountered an error processing your request. Please try again.',
          responseType: 'info',
          metadata: { source: 'error-fallback' }
        },
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
    metadata: { 
      source: 'local-fallback',
      processedAt: new Date().toISOString()
    },
  });
} 