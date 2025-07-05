'use client';

import { useState, useEffect, useRef } from 'react';

interface ResponseBoxProps {
  responseText: string;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onClick: () => void;
  disabled?: boolean;
}

export function ResponseBox({ responseText, isSpeaking, onToggleSpeech, onClick, disabled = false }: ResponseBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Reset text when response changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [responseText]);

  // Typewriter effect when speaking
  useEffect(() => {
    if (!isSpeaking || !responseText || currentIndex >= responseText.length) {
      return;
    }
    let isActive = true;
    const interval = setInterval(() => {
      if (!isActive) return;
      setCurrentIndex(prev => {
        const newIndex = prev + 1;
        setDisplayedText(responseText.slice(0, newIndex));
        return newIndex;
      });
    }, 50);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [isSpeaking, responseText, currentIndex]);

  // Auto-scroll to bottom when text is being typed
  useEffect(() => {
    if (textContainerRef.current && isSpeaking) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [displayedText, isSpeaking]);

  // Show full text when not speaking
  useEffect(() => {
    if (!isSpeaking && responseText) {
      setDisplayedText(responseText);
      setCurrentIndex(responseText.length);
    }
  }, [isSpeaking, responseText]);

  if (!responseText) return null;

  return (
    <div
      className={`w-full max-w-2xl mx-auto mt-8 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onClick}
      title={disabled ? 'Processing...' : 'Click to expand'}
    >
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10 overflow-y-auto max-h-56 min-h-[3em] transition-shadow hover:shadow-lg hover:shadow-blue-500/10">
        <div
          ref={textContainerRef}
          className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap min-h-[2em] max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        >
          {displayedText}
          {isSpeaking && currentIndex < responseText.length && (
            <span className="inline-block w-2 h-6 bg-white/70 animate-pulse ml-1" />
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button
            className={`px-3 py-1 rounded text-xs font-medium ${isSpeaking ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} transition`}
            onClick={e => { e.stopPropagation(); if (!disabled) onToggleSpeech(); }}
            title={disabled ? 'Processing...' : (isSpeaking ? 'Stop speaking' : 'Start speaking')}
            disabled={disabled}
          >
            {isSpeaking ? 'Stop' : 'Speak'}
          </button>
        </div>
      </div>
    </div>
  );
} 