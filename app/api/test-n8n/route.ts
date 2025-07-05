import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { testData } = await request.json();

    // Get n8n workflow URL from environment variables
    const n8nWorkflowUrl = process.env.N8N_WORKFLOW_URL;
    
    if (!n8nWorkflowUrl) {
      return NextResponse.json(
        { error: 'N8N_WORKFLOW_URL environment variable is not set' },
        { status: 500 }
      );
    }

    // Prepare test payload
    const testPayload = {
      transcript: testData || 'Hello, this is a test message',
      timestamp: new Date().toISOString(),
      sessionId: 'test-session',
      userAgent: 'Test-Client/1.0',
      audioData: null,
    };

    console.log('Testing n8n workflow with payload:', testPayload);

    // Call n8n workflow
    const n8nResponse = await fetch(n8nWorkflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Support-WebApp-Test/1.0',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('N8N response status:', n8nResponse.status);
    console.log('N8N response headers:', Object.fromEntries(n8nResponse.headers.entries()));

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return NextResponse.json({
        error: 'N8N workflow failed',
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        responseBody: errorText,
      }, { status: 500 });
    }

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch (parseError) {
      const rawResponse = await n8nResponse.text();
      return NextResponse.json({
        error: 'Failed to parse n8n response as JSON',
        parseError: parseError.message,
        rawResponse,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      n8nResponse: n8nResult,
      responseKeys: Object.keys(n8nResult),
      hasResponseText: !!n8nResult.responseText,
      hasMessage: !!n8nResult.message,
      hasText: !!n8nResult.text,
      hasContent: !!n8nResult.content,
      hasAnswer: !!n8nResult.answer,
      hasResponse: !!n8nResult.response,
    });

  } catch (error) {
    console.error('Test n8n error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
} 