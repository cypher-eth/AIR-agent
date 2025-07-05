'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';

const Sphere = dynamic(() => import('./Sphere').then(mod => mod.Sphere), { ssr: false });

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseText: string;
  isSpeaking: boolean;
}

export function ResponseModal({ 
  isOpen, 
  onClose, 
  responseText, 
  isSpeaking
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

    let isActive = true;
    const interval = setInterval(() => {
      if (!isActive) return;
      setCurrentIndex(prev => {
        const newIndex = prev + 1;
        setDisplayedText(responseText.slice(0, newIndex));
        return newIndex;
      });
    }, 50); // Adjust speed as needed

    return () => {
      isActive = false;
      clearInterval(interval);
    };
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
          <div className="flex items-center space-x-3">
            {/* Small Sphere */}
            <div className="w-8 h-8 flex items-center justify-center">
              <Sphere amplitude={0.5} onVoiceInput={() => {}} small={true} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Air Agent
            </h2>
          </div>
          <div className="flex items-center space-x-3">
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
            {/* Skip Button */}
            {isSpeaking && currentIndex < responseText.length && (
              <button
                className="ml-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
                onClick={() => {
                  setDisplayedText(responseText);
                  setCurrentIndex(responseText.length);
                  // Scroll to bottom after showing all text
                  setTimeout(() => {
                    if (isAutoScrolling && textContainerRef.current) {
                      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
                    }
                  }, 0);
                }}
                title="Skip to end"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 