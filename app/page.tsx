'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ResponseModal } from '@/components/ResponseModal';
import { ResponseBox } from '@/components/ResponseBox';
import { LoginModal, usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Login } from '@/components/Login';

export type ResponseType = 'info' | 'quiz' | 'correct';

export interface AIResponse {
  responseText: string;
  responseAudioUrl?: string;
  responseAudioBase64?: string;
  responseAudio?: string;
  responseType: ResponseType;
  metadata?: any;
}

// App states for better UX control
export type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

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
function playBase64Audio(base64: string, mimeType: string = 'audio/mp3', onAudioCreated?: (audio: HTMLAudioElement) => void): Promise<void> {
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
      
      // Call the callback to store the audio reference
      onAudioCreated?.(audio);
      
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
  // Core state
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [aiDebug, setAiDebug] = useState<any>(null);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [showModal, setShowModal] = useState(false);
  
  // Audio state management
  const [isAIAudioPlaying, setIsAIAudioPlaying] = useState(false);
  
  // Auth state
  const { user, login, authenticated, ready } = usePrivy();
  const { address } = useAccount();
  
  // Refs for audio control
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const processingRef = useRef(false);

  // Stop any currently playing audio
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsAIAudioPlaying(false);
  }, []);

  // Unified function to process audio/transcript with AI
  const processWithAI = useCallback(async (transcript: string, audioBlob?: Blob) => {
    // Prevent multiple simultaneous requests
    if (processingRef.current) {
      console.log('Request already in progress, ignoring new request');
      return;
    }

    processingRef.current = true;
    setAppState('processing');
    setStatus('Thinking...');
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
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
      
      // Debug: Log the AI response structure
      console.log('AI Response structure:', {
        hasResponseText: !!aiResponse.responseText,
        hasResponseAudio: !!aiResponse.responseAudio,
        hasResponseAudioBase64: !!aiResponse.responseAudioBase64,
        hasResponseAudioUrl: !!aiResponse.responseAudioUrl,
        responseAudioLength: aiResponse.responseAudio?.length || 0,
        responseAudioBase64Length: aiResponse.responseAudioBase64?.length || 0,
        allKeys: Object.keys(aiResponse)
      });

      // Always display the response text
      setCurrentResponse(aiResponse.responseText);
      setAiDebug(aiResponse);
      setAppState('speaking');
      setStatus('Playing AI response...');

      // Play audio response if available
      const audioData = aiResponse.responseAudioBase64 || aiResponse.responseAudio;
      
      if (audioData && typeof audioData === 'string' && audioData.length > 100) {
        // Play audio from base64
        console.log('Found base64 audio data, length:', audioData.length);
        setStatus('Playing AI audio...');
        
        try {
          await playBase64Audio(audioData, 'audio/mp3', (audio) => {
            currentAudioRef.current = audio;
          });
          console.log('Base64 audio played successfully');
        } catch (error) {
          console.error('Failed to play base64 audio:', error);
        } finally {
          setAppState('idle');
          setAudioAmplitude(0);
          setStatus('Ready');
          currentAudioRef.current = null;
        }
      } else if (aiResponse.responseAudioUrl) {
        // Fallback: try URL-based audio
        const audio = new Audio(aiResponse.responseAudioUrl);
        currentAudioRef.current = audio;
        setIsPlaying(true);

        const analyseAudio = () => {
          setAudioAmplitude(Math.random() * 0.5 + 0.3);
        };

        const intervalId = setInterval(analyseAudio, 100);

        audio.onended = () => {
          setIsPlaying(false);
          setAudioAmplitude(0);
          clearInterval(intervalId);
          setAppState('idle');
          setStatus('Ready');
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setAudioAmplitude(0);
          clearInterval(intervalId);
          setAppState('idle');
          setStatus('Ready');
          currentAudioRef.current = null;
        };

        await audio.play();
              } else {
          // No audio available
          console.log('No valid audio found');
          setAppState('idle');
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
      setAppState('error');
      setStatus('Error occurred');
      
      // Show error message
      setAppState('idle');
      setStatus('Ready');
    } finally {
      processingRef.current = false;
    }
  }, [stopCurrentAudio]);

  // Handle voice input from Sphere component
  const handleVoiceInput = useCallback(async (transcript: string, audioBlob?: Blob) => {
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
  }, [processWithAI, recordingUrl]);

  // Handle sending audio-only to AI (for the Send button)
  const sendAudioToAI = useCallback(async () => {
    if (!recordingUrl || processingRef.current) return;
    
    try {
      // Convert the blob URL back to a blob
      const response = await fetch(recordingUrl);
      const audioBlob = await response.blob();
      
      // Process with AI using only audio (no transcript)
      await processWithAI('', audioBlob);
    } catch (error) {
      console.error('Error sending audio to AI:', error);
      setCurrentResponse('Sorry, I encountered an error processing your audio. Please try again.');
      setAppState('error');
      setStatus('Error occurred');
      setShowModal(true);
    }
  }, [recordingUrl, processWithAI]);

  // Play the last recording
  const playRecording = useCallback(async () => {
    if (recordingUrl && !isPlaying && appState === 'idle') {
      const audio = new Audio(recordingUrl);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play().catch(() => setIsPlaying(false));
    }
  }, [recordingUrl, isPlaying, appState]);

  // Test n8n workflow
  const testN8nWorkflow = useCallback(async () => {
    if (processingRef.current) return;
    
    setAppState('processing');
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
      setAppState('idle');
      setStatus('Ready');
    }
  }, []);

  // Toggle AI audio playback
  const toggleAudio = useCallback(() => {
    if (isAIAudioPlaying) {
      // Stop AI audio
      stopCurrentAudio();
      setAppState('idle');
      setAudioAmplitude(0);
      setStatus('Ready');
    } else {
      // Start AI audio
      const audioData = aiDebug?.responseAudioBase64 || aiDebug?.responseAudio;
      if (audioData && typeof audioData === 'string' && audioData.length > 100 && appState === 'idle') {
        setIsAIAudioPlaying(true);
        setAppState('speaking');
        setStatus('Playing AI audio...');
        
        playBase64Audio(audioData, 'audio/mp3', (audio) => {
          // Store the audio reference so we can stop it later
          currentAudioRef.current = audio;
        }).then(() => {
          setAppState('idle');
          setAudioAmplitude(0);
          setStatus('Ready');
          currentAudioRef.current = null;
          setIsAIAudioPlaying(false);
        }).catch((error) => {
          console.error('Failed to play AI audio:', error);
          setAppState('idle');
          setAudioAmplitude(0);
          setStatus('Ready');
          currentAudioRef.current = null;
          setIsAIAudioPlaying(false);
        });
      }
    }
  }, [appState, aiDebug, stopCurrentAudio, isAIAudioPlaying]);



  // Modal close handler that also stops speech
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    if (appState === 'speaking') {
      stopCurrentAudio();
      setAppState('idle');
      setAudioAmplitude(0);
      setStatus('Ready');
    }
  }, [appState, stopCurrentAudio]);

  // Handle Sphere state changes
  const handleSphereStateChange = useCallback((sphereState: 'idle' | 'listening') => {
    if (sphereState === 'listening' && appState === 'idle') {
      setAppState('listening');
    } else if (sphereState === 'idle' && appState === 'listening') {
      setAppState('idle');
    }
  }, [appState]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  // Determine if Sphere should be disabled
  const isSphereDisabled = appState === 'processing' || appState === 'speaking';
  const isSpeaking = isAIAudioPlaying;
  const hasAudioResponse = !!(aiDebug?.responseAudioBase64 || aiDebug?.responseAudio || aiDebug?.responseAudioUrl);

  return (
    <>
      <Header status={status} />
      <main className="min-h-screen flex flex-col items-center justify-center p-4">

        {/* AI Avatar Sphere */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl px-4">
          <Sphere 
            amplitude={audioAmplitude}
            onVoiceInput={handleVoiceInput}
            disabled={isSphereDisabled}
            onStateChange={handleSphereStateChange}
          />
        </div>

        {/* Response Box below the sphere */}
        <div className="w-full max-w-4xl px-4">
          <ResponseBox
            responseText={currentResponse}
            isSpeaking={isSpeaking}
            onClick={() => setShowModal(true)}
            disabled={appState === 'processing'}
            hasAudioResponse={hasAudioResponse}
            onToggleAudio={toggleAudio}
            isAIAudioPlaying={isAIAudioPlaying}
          />
        </div>

        {/* Response Modal (only when showModal is true) */}
        <ResponseModal
          isOpen={showModal}
          onClose={handleCloseModal}
          responseText={currentResponse}
          isSpeaking={isSpeaking}
        />
      </main>
    </>
  );
} 