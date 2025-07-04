import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Simulate AI processing with simple logic
    // In a real app, this would call your n8n workflow
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

    // TODO: Replace with actual n8n workflow call
    // const response = await fetch('your-n8n-workflow-url', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ transcript })
    // });

    return NextResponse.json({
      responseText,
      responseType,
      // responseAudioUrl: '/audio/response.mp3' // Optional: if you have pre-recorded audio
    });

  } catch (error) {
    console.error('Error processing voice input:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 