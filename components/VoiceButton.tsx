'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Square } from 'lucide-react';

interface VoiceButtonProps {
  onVoiceInput: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export function VoiceButton({ onVoiceInput, isListening, setIsListening }: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef(false);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      
      // Initialize Speech Recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setTranscript('');
        finalTranscriptRef.current = '';
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
        
        finalTranscriptRef.current = finalTranscript;
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        // Add a small delay to prevent immediate reset
        setTimeout(() => {
          setIsListening(false);
          if (finalTranscriptRef.current.trim() && !isHoldingRef.current) {
            console.log('Sending transcript:', finalTranscriptRef.current);
            onVoiceInput(finalTranscriptRef.current);
          }
        }, 100);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [onVoiceInput, setIsListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      console.log('Starting to listen...');
      isHoldingRef.current = true;
      try {
        // Only start if not already listening
        if (!isListening) {
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        isHoldingRef.current = false;
      }
    } else if (!isSupported) {
      console.log('Speech recognition not supported');
    }
  }, [isSupported, setIsListening, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      console.log('Stopping listening...');
      isHoldingRef.current = false;
      try {
        // Only stop if currently listening
        if (isListening) {
          recognitionRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    }
  }, [isSupported, setIsListening, isListening]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse down - starting to listen');
    setIsHolding(true);
    startListening();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse up - stopping listening');
    setIsHolding(false);
    stopListening();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse leave - stopping listening');
    setIsHolding(false);
    stopListening();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    console.log('Touch start - starting to listen');
    setIsHolding(true);
    startListening();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    console.log('Touch end - stopping listening');
    setIsHolding(false);
    stopListening();
  };

  // Fallback for unsupported browsers or testing
  const handleClick = () => {
    console.log('Button clicked, isSupported:', isSupported, 'isListening:', isListening);
    
    if (!isSupported) {
      // For testing purposes, simulate a voice input
      const testTranscript = 'Hello, this is a test message';
      console.log('Simulating voice input:', testTranscript);
      onVoiceInput(testTranscript);
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
          ${isListening || isHolding
            ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50' 
            : 'bg-primary hover:bg-primary-dark shadow-lg shadow-primary/50'
          }
          cursor-pointer
          active:scale-95
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 mx-auto" />
        ) : (
          <Mic className="w-8 h-8 mx-auto" />
        )}
        
        {/* Pulse animation when listening or holding */}
        {(isListening || isHolding) && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
        )}
      </button>
      
      <div className="text-center">
        <p className="text-lg font-medium">
          {isListening ? '🎙️ Listening...' : isHolding ? '🎙️ Holding...' : '🎙️ Hold to Talk'}
        </p>
        {!isSupported && (
          <p className="text-sm text-yellow-400 mt-1">
            Click to test (simulated input)
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