'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { playTextToSpeech, stopTextToSpeech } from '@/lib/audio';
import { Play, Square, Send } from 'lucide-react';
import { ResponseModal } from '@/components/ResponseModal';
import { ResponseBox } from '@/components/ResponseBox';

export type ResponseType = 'info' | 'quiz' | 'correct';

export interface AIResponse {
  responseText: string;
  responseAudioUrl?: string;
  responseType: ResponseType;
  metadata?: any;
}

// Dynamically import Sphere with SSR disabled
const Sphere = dynamic(() => import('@/components/Sphere').then(mod => mod.Sphere), { ssr: false });

// Helper to convert base64 to Blob
function b64toBlob(b64Data: string, contentType: string = '', sliceSize: number = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

// Helper to convert base64 to Blob and play audio
function playBase64Audio(base64: string, mimeType: string = 'audio/mp3'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate base64 string
      if (!base64 || typeof base64 !== 'string' || base64.length < 100) {
        reject(new Error('Invalid or empty base64 audio data'));
        return;
      }

      const audioBlob = b64toBlob(base64, mimeType);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        console.log('Base64 audio loaded successfully, duration:', audio.duration);
      };
      
      audio.onerror = (e) => {
        console.error('Error playing base64 audio:', e);
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to play audio'));
      };
      
      audio.onended = () => {
        console.log('Base64 audio playback ended');
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.play().catch((error) => {
        console.error('Error starting audio playback:', error);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      });
    } catch (error) {
      console.error('Error creating audio from base64:', error);
      reject(error);
    }
  });
}

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
  const [showModal, setShowModal] = useState(false);

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

      let aiResponse;
      let errorMessage = '';
      try {
        aiResponse = await response.json();
      } catch (e) {
        aiResponse = null;
      }
      if (!response.ok || aiResponse?.error) {
        errorMessage = aiResponse?.error || 'Sorry, something went wrong with the AI service. Please try again later.';
        setCurrentResponse(errorMessage);
        setStatus('Error occurred');
        setIsSpeaking(true);
        await playTextToSpeech(errorMessage);
        setIsSpeaking(false);
        setStatus('Ready');
        return;
      }

      // Always display the response text
      setCurrentResponse(aiResponse.responseText);
      setAiDebug(aiResponse);
      setStatus('Playing AI response...');
      
      // Debug: Log the AI response structure
      console.log('AI Response structure:', {
        hasResponseText: !!aiResponse.responseText,
        hasResponseAudio: !!aiResponse.responseAudio,
        hasResponseAudioBase64: !!aiResponse.responseAudioBase64,
        responseAudioLength: aiResponse.responseAudio?.length || 0,
        responseAudioBase64Length: aiResponse.responseAudioBase64?.length || 0,
        responseAudioType: typeof aiResponse.responseAudio,
        responseAudioBase64Type: typeof aiResponse.responseAudioBase64,
        allKeys: Object.keys(aiResponse)
      });

      // Play audio response if available
      const audioData = aiResponse.responseAudioBase64 || aiResponse.responseAudio;
      
      if (audioData && typeof audioData === 'string' && audioData.length > 100) {
        // Play audio from base64
        console.log('Found base64 audio data, length:', audioData.length);
        setIsSpeaking(true);
        setStatus('Playing AI audio...');
        
        try {
          await playBase64Audio(audioData, 'audio/mp3');
          console.log('Base64 audio played successfully');
        } catch (error) {
          console.error('Failed to play base64 audio, falling back to TTS:', error);
          // Fall back to text-to-speech if base64 audio fails
          setIsSpeaking(true);
          await playTextToSpeech(aiResponse.responseText, (amplitude) => {
            setAudioAmplitude(amplitude);
          });
        } finally {
          setIsSpeaking(false);
          setAudioAmplitude(0);
          setStatus('Ready');
        }
      } else {
        // Use Web Speech API for text-to-speech as fallback
        console.log('No valid base64 audio found, using text-to-speech...');
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
      setShowModal(true);
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
      setShowModal(true);
    } finally {
      setIsProcessing(false);
      setStatus('Ready');
    }
  };

  // Toggle speech playback
  const toggleSpeech = () => {
    if (isSpeaking) {
      // Stop speaking
      setIsSpeaking(false);
      setAudioAmplitude(0);
    } else {
      // Start speaking
      if (currentResponse) {
        setIsSpeaking(true);
        playTextToSpeech(currentResponse, (amplitude) => {
          setAudioAmplitude(amplitude);
        }).then(() => {
          setIsSpeaking(false);
          setAudioAmplitude(0);
        });
      }
    }
  };

  // Modal close handler that also stops speech
  const handleCloseModal = () => {
    setShowModal(false);
    setIsSpeaking(false);
    setAudioAmplitude(0);
    stopTextToSpeech();
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

      {/* Response Box below the sphere */}
      <ResponseBox
        responseText={currentResponse}
        isSpeaking={isSpeaking}
        onToggleSpeech={toggleSpeech}
        onClick={() => setShowModal(true)}
      />

      {/* Response Modal (only when showModal is true) */}
      <ResponseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        responseText={currentResponse}
        isSpeaking={isSpeaking}
        onToggleSpeech={toggleSpeech}
      />
    </main>
  );
} 