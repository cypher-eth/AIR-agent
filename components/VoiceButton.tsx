'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  onVoiceInput: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export function VoiceButton({ onVoiceInput, isListening, setIsListening }: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      
      // Initialize Speech Recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim() && !isHoldingRef.current) {
          onVoiceInput(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [onVoiceInput, setIsListening, transcript]);

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      isHoldingRef.current = true;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isSupported) {
      isHoldingRef.current = false;
      recognitionRef.current.stop();
    }
  };

  const handleMouseDown = () => {
    startListening();
  };

  const handleMouseUp = () => {
    stopListening();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startListening();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopListening();
  };

  // Fallback for unsupported browsers
  const handleClick = () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        className={`
          relative w-20 h-20 rounded-full font-medium text-white
          transition-all duration-200 transform
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50' 
            : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/50'
          }
          ${isSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
          active:scale-95
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        disabled={!isSupported}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 mx-auto" />
        ) : (
          <Mic className="w-8 h-8 mx-auto" />
        )}
        
        {/* Pulse animation when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
        )}
      </button>
      
      <div className="text-center">
        <p className="text-lg font-medium">
          {isListening ? '🎙️ Listening...' : '🎙️ Hold to Talk'}
        </p>
        {!isSupported && (
          <p className="text-sm text-red-400 mt-1">
            Speech recognition not supported
          </p>
        )}
      </div>
      
      {/* Live transcript display */}
      {transcript && (
        <div className="max-w-md mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <p className="text-sm text-gray-300 text-center">
              {transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 