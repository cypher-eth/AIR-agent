'use client';

import { useState, useEffect } from 'react';
import { Sphere } from '@/components/Sphere';
import { VoiceButton } from '@/components/VoiceButton';
import { Modal } from '@/components/Modal';
import { WagmiProvider } from '@/components/WagmiProvider';
import { playTextToSpeech } from '@/lib/audio';

export type ResponseType = 'info' | 'quiz' | 'correct';

export interface AIResponse {
  responseText: string;
  responseAudioUrl?: string;
  responseType: ResponseType;
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [audioAmplitude, setAudioAmplitude] = useState(0);

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    try {
      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();
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
        setIsSpeaking(true);
        await playTextToSpeech(aiResponse.responseText, (amplitude) => {
          setAudioAmplitude(amplitude);
        });
        setIsSpeaking(false);
        setAudioAmplitude(0);
      }

      // Show congratulations modal if answer is correct
      if (aiResponse.responseType === 'correct') {
        setShowModal(true);
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
    <WagmiProvider>
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* AI Avatar Sphere */}
        <div className="flex-1 flex items-center justify-center">
          <Sphere 
            isIdle={!isListening && !isSpeaking}
            isSpeaking={isSpeaking}
            amplitude={audioAmplitude}
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

        {/* Voice Input Button */}
        <div className="mb-8">
          <VoiceButton
            onVoiceInput={handleVoiceInput}
            isListening={isListening}
            setIsListening={setIsListening}
          />
        </div>

        {/* Congratulations Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="🎉 Congratulations!"
          subtitle="You answered correctly!"
        />
      </main>
    </WagmiProvider>
  );
} 