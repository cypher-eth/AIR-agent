'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseText: string;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
}

export function ResponseModal({ 
  isOpen, 
  onClose, 
  responseText, 
  isSpeaking, 
  onToggleSpeech 
}: ResponseModalProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Reset text when modal opens with new response
  useEffect(() => {
    if (isOpen && responseText) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [isOpen, responseText]);

  // Typewriter effect when speaking
  useEffect(() => {
    if (!isSpeaking || !responseText || currentIndex >= responseText.length) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const newIndex = prev + 1;
        setDisplayedText(responseText.slice(0, newIndex));
        return newIndex;
      });
    }, 50); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [isSpeaking, responseText, currentIndex]);

  // Auto-scroll to bottom when text is being typed
  useEffect(() => {
    if (isAutoScrolling && textContainerRef.current && isSpeaking) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [displayedText, isSpeaking, isAutoScrolling]);

  // Show full text when not speaking
  useEffect(() => {
    if (!isSpeaking && responseText) {
      setDisplayedText(responseText);
      setCurrentIndex(responseText.length);
    }
  }, [isSpeaking, responseText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            AI Response
          </h2>
          <div className="flex items-center space-x-3">
            {/* Speech Toggle */}
            <button
              onClick={onToggleSpeech}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${isSpeaking 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }
              `}
              title={isSpeaking ? 'Stop speaking' : 'Start speaking'}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div 
            ref={textContainerRef}
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            <div className="prose prose-invert max-w-none">
              <div className="text-white/90 leading-relaxed text-lg whitespace-pre-wrap">
                {displayedText}
                {isSpeaking && currentIndex < responseText.length && (
                  <span className="inline-block w-2 h-6 bg-white/70 animate-pulse ml-1" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-white/60">
            <span>
              {isSpeaking ? 'Speaking...' : 'Ready'}
            </span>
            <span>
              {currentIndex} / {responseText.length} characters
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={isAutoScrolling}
                onChange={(e) => setIsAutoScrolling(e.target.checked)}
                className="rounded border-white/20 bg-white/10"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 