// Web Speech API utilities

export function playTextToSpeech(
  text: string,
  onAmplitudeChange?: (amplitude: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech settings
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a more natural voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang === 'en-US' && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang === 'en-US');
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Simulate amplitude for animation
    let intervalId: NodeJS.Timeout | null = null;
    
    utterance.onstart = () => {
      if (onAmplitudeChange) {
        intervalId = setInterval(() => {
          // Simulate realistic amplitude variation
          const amplitude = Math.random() * 0.5 + 0.3;
          onAmplitudeChange(amplitude);
        }, 100);
      }
    };

    utterance.onend = () => {
      if (intervalId) {
        clearInterval(intervalId);
        onAmplitudeChange?.(0);
      }
      resolve();
    };

    utterance.onerror = (event) => {
      if (intervalId) {
        clearInterval(intervalId);
        onAmplitudeChange?.(0);
      }
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    speechSynthesis.speak(utterance);
  });
}

export function stopTextToSpeech(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  
  return speechSynthesis.getVoices();
}

export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Audio analysis utilities for future use
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  async getAmplitudeFromAudio(audioElement: HTMLAudioElement): Promise<number> {
    if (!this.audioContext || !this.analyser || !this.dataArray) {
      return 0;
    }

    try {
      const source = this.audioContext.createMediaElementSource(audioElement);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate average amplitude
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      return average / 255; // Normalize to 0-1
    } catch (error) {
      console.error('Error analyzing audio:', error);
      return 0;
    }
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
} 