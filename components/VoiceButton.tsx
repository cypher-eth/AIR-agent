'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { useState as useLocalState } from 'react';

interface VoiceButtonProps {
  onVoiceInput: (transcript: string, audioBlob?: Blob) => void;
  isListening: boolean;
  isHolding: boolean;
  setIsListening: (listening: boolean) => void;
  setIsHolding: (holding: boolean) => void;
}

export function VoiceButton({ onVoiceInput, isListening, isHolding, setIsListening, setIsHolding }: VoiceButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isHoldingRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const [isLoading, setIsLoading] = useLocalState(false);

  // Initialize speech recognition and audio recording
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
        setIsListening(false);
        // Only send transcript if we're not holding (button was released)
        if (finalTranscriptRef.current.trim() && !isHoldingRef.current) {
          console.log('Sending transcript:', finalTranscriptRef.current);
          onVoiceInput(finalTranscriptRef.current, audioBlobRef.current || undefined);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }

    // Cleanup function
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [onVoiceInput, setIsListening]);

  // Audio recording functions
  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);
        audioBlobRef.current = audioBlob;

        // Create URL for the audio blob
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        console.log('Audio URL:', audioUrlRef.current);

        setHasRecording(true);
        setIsRecording(false);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Send transcript and audio if button was released
        if (!isHoldingRef.current && finalTranscriptRef.current.trim()) {
          console.log('Sending transcript from audio recording:', finalTranscriptRef.current);
          onVoiceInput(finalTranscriptRef.current, audioBlob);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = audioChunks;
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log('Audio recording stopped');
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioUrlRef.current && hasRecording) {
      const audio = new Audio(audioUrlRef.current);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        console.error('Error playing audio');
      };
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  }, [hasRecording]);

  const startListening = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      isHoldingRef.current = true;
      setIsHolding(true);
      // Clear previous transcript
      setTranscript('');
      finalTranscriptRef.current = '';
      if (recognitionRef.current && isSupported) {
        try {
          recognitionRef.current.start();
          startAudioRecording();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setIsListening(false);
          isHoldingRef.current = false;
          setIsHolding(false);
        }
      } else if (!isSupported) {
        startAudioRecording();
      }
    }, 500);
  }, [isSupported, setIsListening, startAudioRecording, setIsHolding]);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    isHoldingRef.current = false;
    setIsHolding(false);
    
    if (recognitionRef.current && isSupported) {
      try {
        // Stop speech recognition
        recognitionRef.current.stop();
        // Stop audio recording
        stopAudioRecording();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    } else {
      // Stop audio recording even without speech recognition
      stopAudioRecording();
    }
  }, [isSupported, setIsListening, stopAudioRecording, setIsHolding]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse down - starting to listen');
    startListening();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse up - stopping listening');
    stopListening();
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Mouse leave - stopping listening');
    stopListening();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    console.log('Touch start - starting to listen');
    startListening();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    console.log('Touch end - stopping listening');
    stopListening();
  };

  // Fallback for unsupported browsers or testing
  const handleClick = () => {
    if (isSupported) {
      if (isHolding) {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        {/* Play Button */}
        {hasRecording && (
          <button
            className={`
              relative w-20 h-20 rounded-full font-medium text-white
              transition-all duration-200 transform
              ${isPlaying
                ? 'bg-green-500 hover:bg-green-600 scale-110 shadow-lg shadow-green-500/50' 
                : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/50'
              }
              cursor-pointer
              active:scale-95
            `}
            onClick={playRecording}
            disabled={isPlaying}
          >
            {isPlaying ? (
              <Square className="w-8 h-8 mx-auto" />
            ) : (
              <Play className="w-8 h-8 mx-auto" />
            )}
            
            {/* Pulse animation when playing */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
            )}
          </button>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium min-h-[1.5em] flex items-center justify-center">
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          ) : isListening ? '🎙️ Listening...' : isRecording ? '🎙️ Recording...' : isHolding ? '🎙️ Holding...' : '🎙️ Hold to Talk'}
        </p>
        {hasRecording && (
          <p className="text-sm text-green-400 mt-1">
            {isPlaying ? 'Playing recording...' : 'Click play to hear your recording'}
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