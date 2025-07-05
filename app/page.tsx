'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { playTextToSpeech } from '@/lib/audio';
import { Play, Square, Send } from 'lucide-react';

export type ResponseType = 'info' | 'quiz' | 'correct';

export interface AIResponse {
  responseText: string;
  responseAudioUrl?: string;
  responseType: ResponseType;
  metadata?: any;
}

// Dynamically import Sphere with SSR disabled
const Sphere = dynamic(() => import('@/components/Sphere').then(mod => mod.Sphere), { ssr: false });

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [aiDebug, setAiDebug] = useState<any>(null);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('Ready');

  // Unified function to process audio/transcript with AI
  const processWithAI = async (transcript: string, audioBlob?: Blob) => {
    setIsProcessing(true);
    setStatus('Processing with AI...');
    
    try {
      // Convert audio blob to base64 if available
      let audioBlobBase64 = null;
      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        audioBlobBase64 = btoa(binaryString);
        console.log('Audio blob converted to base64, size:', audioBlobBase64.length);
      }

      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript,
          audioBlob: audioBlobBase64 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const aiResponse: AIResponse = await response.json();
      console.log('AI Response:', aiResponse);
      
      // Always display the response text
      setCurrentResponse(aiResponse.responseText);
      setAiDebug(aiResponse);
      setStatus('Playing AI response...');

      // Play audio response if available
      if (aiResponse.responseAudioUrl) {
        const audio = new Audio(aiResponse.responseAudioUrl);
        setIsSpeaking(true);
        
        const analyseAudio = () => {
          setAudioAmplitude(Math.random() * 0.5 + 0.3);
        };
        
        const intervalId = setInterval(analyseAudio, 100);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioAmplitude(0);
          clearInterval(intervalId);
          setStatus('Ready');
        };
        
        await audio.play();
      } else {
        // Use Web Speech API for text-to-speech
        console.log('Playing text-to-speech...');
        setIsSpeaking(true);
        await playTextToSpeech(aiResponse.responseText, (amplitude) => {
          setAudioAmplitude(amplitude);
        });
        setIsSpeaking(false);
        setAudioAmplitude(0);
        setStatus('Ready');
      }

      // Show congratulations message if answer is correct
      if (aiResponse.responseType === 'correct') {
        setTimeout(() => {
          alert('🎉 Congratulations! You answered correctly!');
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      const errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
      setCurrentResponse(errorMessage);
      setStatus('Error occurred');
      
      // Play error message
      setIsSpeaking(true);
      await playTextToSpeech(errorMessage);
      setIsSpeaking(false);
      setStatus('Ready');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle voice input from Sphere component
  const handleVoiceInput = async (transcript: string, audioBlob?: Blob) => {
    console.log('Received voice input:', transcript);
    console.log('Audio blob received:', audioBlob ? `Size: ${audioBlob.size}, Type: ${audioBlob.type}` : 'No audio blob');
    
    // If audioBlob is present, create a URL for playback
    if (audioBlob) {
      console.log('Creating recording URL from audio blob...');
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      const newRecordingUrl = URL.createObjectURL(audioBlob);
      console.log('New recording URL created:', newRecordingUrl);
      setRecordingUrl(newRecordingUrl);
    }

    // Process with AI (even if transcript is empty, n8n can process audio)
    await processWithAI(transcript, audioBlob);
  };

  // Handle sending audio-only to AI (for the Send button)
  const sendAudioToAI = async () => {
    if (!recordingUrl) return;
    
    try {
      // Convert the blob URL back to a blob
      const response = await fetch(recordingUrl);
      const audioBlob = await response.blob();
      
      // Process with AI using only audio (no transcript)
      await processWithAI('', audioBlob);
    } catch (error) {
      console.error('Error sending audio to AI:', error);
      setCurrentResponse('Sorry, I encountered an error processing your audio. Please try again.');
      setStatus('Error occurred');
    }
  };

  // Play the last recording
  const playRecording = async () => {
    if (recordingUrl && !isPlaying) {
      const audio = new Audio(recordingUrl);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play().catch(() => setIsPlaying(false));
    }
  };

  // Test n8n workflow
  const testN8nWorkflow = async () => {
    setIsProcessing(true);
    setStatus('Testing n8n workflow...');
    
    try {
      const response = await fetch('/api/test-n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testData: 'Hello, this is a test message from the web app'
        }),
      });

      const result = await response.json();
      console.log('N8N test result:', result);
      
      if (result.success) {
        setCurrentResponse(`N8N Test Successful! Response keys: ${result.responseKeys.join(', ')}`);
        setAiDebug(result);
      } else {
        setCurrentResponse(`N8N Test Failed: ${result.error}`);
        setAiDebug(result);
      }
    } catch (error) {
      console.error('Error testing n8n:', error);
      setCurrentResponse('Error testing n8n workflow');
    } finally {
      setIsProcessing(false);
      setStatus('Ready');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Status Display */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <p className="text-center text-sm text-white/80">
            Status: <span className="font-medium">{status}</span>
          </p>
        </div>
      </div>

      {/* AI Avatar Sphere */}
      <div className="flex-1 flex items-center justify-center">
        <Sphere 
          amplitude={audioAmplitude}
          onVoiceInput={handleVoiceInput}
        />
      </div>

      {/* Response Text Display */}
      {currentResponse && (
        <div className="w-full max-w-2xl mx-4 mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <p className="text-center text-lg leading-relaxed">
              {currentResponse}
            </p>
            {aiDebug && (
              <details className="mt-4">
                <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                <pre className="mt-2 text-xs text-left text-gray-400 whitespace-pre-wrap break-all">
                  {JSON.stringify(aiDebug, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center space-x-4 mb-8">
        {/* Play Recording Button */}
        <button
          className={`
            relative w-20 h-20 rounded-full font-medium text-white
            transition-all duration-200 transform
            ${!recordingUrl
              ? 'bg-gray-400 cursor-not-allowed shadow-lg shadow-gray-400/50'
              : isPlaying
                ? 'bg-green-500 hover:bg-green-600 scale-110 shadow-lg shadow-green-500/50' 
                : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/50'
            }
            cursor-pointer
            active:scale-95
          `}
          onClick={playRecording}
          disabled={isPlaying || !recordingUrl}
          title="Play last recording"
        >
          {isPlaying ? (
            <Square className="w-8 h-8 mx-auto" />
          ) : (
            <Play className="w-8 h-8 mx-auto" />
          )}
          {(isPlaying || !recordingUrl) && (
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
          )}
        </button>

        {/* Send to AI Button */}
        <button
          className={`
            relative w-20 h-20 rounded-full font-medium text-white
            transition-all duration-200 transform
            ${!recordingUrl
              ? 'bg-gray-400 cursor-not-allowed shadow-lg shadow-gray-400/50'
              : isProcessing
                ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/50' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/50'
            }
            cursor-pointer
            active:scale-95
          `}
          onClick={sendAudioToAI}
          disabled={isProcessing || !recordingUrl}
          title="Send audio to AI"
        >
          {isProcessing ? (
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-8 h-8 mx-auto" />
          )}
          {(isProcessing || !recordingUrl) && (
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
          )}
        </button>

        {/* Test N8N Button */}
        <button
          className={`
            relative w-20 h-20 rounded-full font-medium text-white
            transition-all duration-200 transform
            ${isProcessing
              ? 'bg-yellow-500 scale-110 shadow-lg shadow-yellow-500/50' 
              : 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-600/50'
            }
            cursor-pointer
            active:scale-95
          `}
          onClick={testN8nWorkflow}
          disabled={isProcessing}
          title="Test n8n workflow"
        >
          {isProcessing ? (
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-8 h-8 mx-auto text-center text-sm font-bold">T</div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-20" />
          )}
        </button>
      </div>
    </main>
  );
} 