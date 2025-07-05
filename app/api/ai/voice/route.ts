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
      // Return error if n8n fails
      return NextResponse.json(
        { error: 'Failed to get a response from n8n workflow.' },
        { status: 502 }
      );
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
      // Return error if n8n response is not usable
      return NextResponse.json(
        { error: 'Invalid response from n8n workflow.' },
        { status: 502 }
      );
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
    console.log('n8n response type:', typeof n8nResult);
    console.log('n8n response length:', Array.isArray(n8nResult) ? n8nResult.length : 'not an array');

    // Extract response text with proper fallback logic
    let responseText = '';
    if (n8nResult.responseText) {
      responseText = n8nResult.responseText;
      console.log('Found responseText:', responseText);
    } else if (n8nResult.output) {
      responseText = n8nResult.output;
      console.log('Found output:', responseText);
    } else if (n8nResult.message) {
      responseText = n8nResult.message;
      console.log('Found message:', responseText);
    } else if (n8nResult.text) {
      responseText = n8nResult.text;
      console.log('Found text:', responseText);
    } else if (n8nResult.content) {
      responseText = n8nResult.content;
      console.log('Found content:', responseText);
    } else if (n8nResult.answer) {
      responseText = n8nResult.answer;
      console.log('Found answer:', responseText);
    } else if (n8nResult.response) {
      responseText = n8nResult.response;
      console.log('Found response:', responseText);
    } else if (typeof n8nResult === 'string') {
      responseText = n8nResult;
      console.log('Using string response:', responseText);
    } else {
      console.log('No response text found in any expected field');
      // Return error if no usable response
      return NextResponse.json(
        { error: 'No usable response text received from n8n.' },
        { status: 502 }
      );
    }

    // Extract audio data from n8n response
    let responseAudioBase64 = null;
    
    // Check for base64 audio data directly in the response
    if (n8nResult.responseAudio && typeof n8nResult.responseAudio === 'string') {
      responseAudioBase64 = n8nResult.responseAudio;
      console.log('Found responseAudio base64 data, length:', responseAudioBase64.length);
    } else if (n8nResult.responseAudioBase64 && typeof n8nResult.responseAudioBase64 === 'string') {
      responseAudioBase64 = n8nResult.responseAudioBase64;
      console.log('Found responseAudioBase64 data, length:', responseAudioBase64.length);
    } else {
      // Fallback: try to fetch audio file from URL if present
      let audioUrl = n8nResult.responseAudioUrl || n8nResult.audioFileUrl || n8nResult.audioUrl || null;
      if (audioUrl) {
        try {
          console.log('Fetching audio from URL:', audioUrl);
          const audioRes = await fetch(audioUrl);
          if (audioRes.ok) {
            const audioBuffer = await audioRes.arrayBuffer();
            responseAudioBase64 = Buffer.from(audioBuffer).toString('base64');
            console.log('Fetched audio from URL, converted to base64, length:', responseAudioBase64.length);
          } else {
            console.error('Failed to fetch audio file from n8n:', audioRes.status, audioRes.statusText);
          }
        } catch (err) {
          console.error('Error fetching audio file from n8n:', err);
        }
      }
    }
    
    console.log('Final audio data status:', {
      hasResponseAudioBase64: !!responseAudioBase64,
      responseAudioBase64Length: responseAudioBase64?.length || 0
    });

    // Return the n8n workflow response
    return NextResponse.json({
      responseText,
      responseType: n8nResult.responseType || 'info',
      responseAudioBase64,
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
    // Return error if n8n is unavailable
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