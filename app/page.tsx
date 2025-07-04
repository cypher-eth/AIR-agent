'use client';

import { useState } from 'react';
import { Sphere } from '@/components/Sphere';
import { VoiceButton } from '@/components/VoiceButton';
import { playTextToSpeech } from '@/lib/audio';
import { Play, Square } from 'lucide-react';

export type ResponseType = 'info' | 'quiz' | 'correct';

export interface AIResponse {
  responseText: string;
  responseAudioUrl?: string;
  responseType: ResponseType;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

    // Only proceed with AI processing if there's a transcript
    if (!transcript.trim()) {
      console.log('Empty transcript, skipping AI processing');
      return;
    }

    try {
      console.log('Sending to API...');
      
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
        throw new Error('Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();
      console.log('AI Response:', aiResponse);
      setCurrentResponse(aiResponse.responseText);

      // Play audio response
      if (aiResponse.responseAudioUrl) {
        // If audio URL is provided, play it
        const audio = new Audio(aiResponse.responseAudioUrl);
        setIsSpeaking(true);
        
        // Monitor audio for amplitude (simplified)
        const analyseAudio = () => {
          setAudioAmplitude(Math.random() * 0.5 + 0.3); // Simulate amplitude
        };
        
        const intervalId = setInterval(analyseAudio, 100);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioAmplitude(0);
          clearInterval(intervalId);
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
      }

      // Show congratulations message if answer is correct
      if (aiResponse.responseType === 'correct') {
        alert('🎉 Congratulations! You answered correctly!');
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      setCurrentResponse('Sorry, I encountered an error. Please try again.');
      
      // Play error message
      setIsSpeaking(true);
      await playTextToSpeech('Sorry, I encountered an error. Please try again.');
      setIsSpeaking(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
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
          </div>
        </div>
      )}

      {/* Play Button for last recording */}
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
            mb-8
          `}
          onClick={async () => {
            if (recordingUrl && !isPlaying) {
              const audio = new Audio(recordingUrl);
              setIsPlaying(true);
              audio.onended = () => setIsPlaying(false);
              audio.onerror = () => setIsPlaying(false);
              await audio.play().catch(() => setIsPlaying(false));
            }
          }}
          disabled={isPlaying || !recordingUrl}
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

      {/* Play button and other controls will be added here after moving record logic to Sphere */}
    </main>
  );
} 