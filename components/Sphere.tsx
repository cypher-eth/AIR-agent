'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SphereProps {
  amplitude: number;
  onVoiceInput: (transcript: string, audioBlob?: Blob) => void;
  small?: boolean;
  disabled?: boolean;
  onStateChange?: (state: 'idle' | 'listening') => void;
}

function AnimatedSphere({ isIdle, isSpeaking, isListening, amplitude }: { isIdle: boolean; isSpeaking: boolean; isListening: boolean; amplitude: number; }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const distortionRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Base breathing animation for all states
    const baseBreathing = 1 + Math.sin(time * 0.8) * 0.03;
    
    // Subtle floating movement
    const floatY = Math.sin(time * 0.6) * 0.02;
    
    // Surface distortion animation
    const distortionIntensity = isListening ? 0.15 : isSpeaking ? 0.1 : 0.05;
    const distortionX = Math.sin(time * 1.2) * distortionIntensity;
    const distortionY = Math.cos(time * 0.9) * distortionIntensity;
    const distortionZ = Math.sin(time * 1.5) * distortionIntensity;

    if (isListening) {
      // Enhanced pulsing animation when listening
      const pulseScale = baseBreathing * (1 + Math.sin(time * 1.8) * 0.2);
      meshRef.current.scale.setScalar(pulseScale);
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.x = Math.sin(time * 0.7) * 0.05;
      meshRef.current.position.y = floatY;
      
      // Add wobble effect
      meshRef.current.rotation.z = Math.sin(time * 1.1) * 0.03;
    } else if (isIdle) {
      // Gentle breathing and floating animation
      const scale = baseBreathing;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y = time * 0.08;
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.02;
      meshRef.current.position.y = floatY;
      
      // Subtle wobble
      meshRef.current.rotation.z = Math.sin(time * 0.6) * 0.01;
    } else if (isSpeaking) {
      // Dynamic speaking animation with amplitude
      const speakScale = baseBreathing * (1 + amplitude * 0.4);
      const breathScale = 1 + Math.sin(time * 2.2) * 0.03;
      meshRef.current.scale.setScalar(speakScale * breathScale);
      meshRef.current.rotation.y = time * 0.4;
      meshRef.current.rotation.x = Math.sin(time * 3.2) * 0.15;
      meshRef.current.position.y = floatY + Math.sin(time * 4) * 0.01;
      
      // Enhanced wobble for speaking
      meshRef.current.rotation.z = Math.sin(time * 2.8) * 0.08;
    }

    // Apply surface distortion
    if (distortionRef.current) {
      distortionRef.current.position.x = distortionX;
      distortionRef.current.position.y = distortionY;
      distortionRef.current.position.z = distortionZ;
      distortionRef.current.rotation.x = time * 0.3;
      distortionRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <>
      {/* Inner glow sphere for listening state */}
      {isListening && (
        <mesh position={[0, 0, 0]} scale={[1.3, 1.3, 1.3]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#f9a8d4"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
      
      {/* Surface distortion layer */}
      <mesh ref={distortionRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.02, 64, 64]} />
        <meshBasicMaterial
          color={isIdle || isListening ? "#e0e7ef" : "#6366f1"}
          transparent
          opacity={0.1}
          wireframe={false}
        />
      </mesh>
      
      {/* Main sphere */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color={isIdle || isListening ? "#e0e7ef" : "#6366f1"}
          roughness={0.02}
          metalness={0.15}
          transmission={0.9}
          thickness={0.8}
          ior={1.4}
          transparent={true}
          opacity={0.7}
          clearcoat={1}
          clearcoatRoughness={0.02}
          reflectivity={0.8}
          emissive={isSpeaking ? "#6366f1" : isListening ? "#f9a8d4" : "#e0e7ef"}
          emissiveIntensity={isSpeaking ? amplitude * 0.6 : isListening ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh position={[0, 0, 0]} scale={[1.1, 1.1, 1.1]}>
        <ringGeometry args={[0.95, 1.05, 32]} />
        <meshBasicMaterial
          color={isIdle || isListening ? "#e0e7ef" : "#6366f1"}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

export function Sphere({ amplitude, onVoiceInput, small, disabled = false, onStateChange }: SphereProps) {
  const [isIdle, setIsIdle] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isHoldingRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setIsListening(true);
        setIsIdle(false);
        finalTranscriptRef.current = '';
        onStateChange?.('listening');
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
      };
      recognition.onend = () => {
        if (isHoldingRef.current) {
          // User is still holding, so restart recognition
          try {
            recognition.start();
          } catch (e) {
            // Optionally handle error
          }
          return;
        }
        setIsListening(false);
        setIsIdle(true);
        onStateChange?.('idle');
        onVoiceInput(finalTranscriptRef.current, audioBlobRef.current || undefined);
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        setIsIdle(true);
        onStateChange?.('idle');
      };
      recognitionRef.current = recognition;
    }
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [onVoiceInput]);

  const startAudioRecording = useCallback(async () => {
    try {
      console.log('Starting audio recording...');
      
      // Prevent multiple recordings
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('Already recording audio, skipping');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got audio stream:', stream);
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio recording stopped, blob size:', audioBlob.size);
        audioBlobRef.current = audioBlob;
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        console.log('Audio URL created:', audioUrlRef.current);
        stream.getTracks().forEach(track => track.stop());
        if (!isHoldingRef.current) {
          console.log('Calling onVoiceInput with transcript:', finalTranscriptRef.current, 'and audio blob size:', audioBlob.size);
          onVoiceInput(finalTranscriptRef.current, audioBlob);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = audioChunks;
      mediaRecorder.start();
    } catch (error) {
      // handle error
    }
  }, [onVoiceInput]);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    console.log('Pointer down - starting recording');
    e.preventDefault();
    
    // Prevent interaction if disabled
    if (disabled) {
      console.log('Sphere is disabled, ignoring pointer down');
      return;
    }
    
    // Prevent multiple starts
    if (isHoldingRef.current) {
      console.log('Already recording, ignoring pointer down');
      return;
    }
    
    isHoldingRef.current = true;
    setIsListening(true);
    setIsIdle(false);
    console.log('Sphere state: isListening=true, isIdle=false');
    
    if (recognitionRef.current && isSupported) {
      try {
        // Check if recognition is already active
        if (recognitionRef.current.state === 'inactive') {
          console.log('Starting speech recognition...');
          recognitionRef.current.start();
        }
        console.log('Starting audio recording...');
        startAudioRecording();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
        setIsIdle(true);
        isHoldingRef.current = false;
      }
    } else if (!isSupported) {
      console.log('Speech recognition not supported, starting audio recording only...');
      startAudioRecording();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    console.log('Pointer up - stopping recording');
    e.preventDefault();
    isHoldingRef.current = false;
    setIsListening(false);
    setIsIdle(true);
    console.log('Sphere state: isListening=false, isIdle=true');
    
    if (recognitionRef.current && isSupported) {
      try {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
        console.log('Stopping audio recording...');
        stopAudioRecording();
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
        setIsIdle(true);
      }
    } else {
      console.log('Stopping audio recording (no speech recognition)...');
      stopAudioRecording();
    }
  };

  return (
    <div
      className={small ? 'relative flex items-center justify-center select-none w-full h-full' : 'relative flex items-center justify-center select-none'}
      style={small ? {} : { width: 240, height: 240 }}
      {...(!small && !disabled && {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerUp,
        onPointerCancel: handlePointerUp,
      })}
    >
      <Canvas camera={{ position: [0, 0, 3] }} shadows style={small ? { width: '100%', height: '100%' } : {}}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <AnimatedSphere isIdle={isIdle} isSpeaking={isSpeaking} isListening={isListening} amplitude={amplitude} />
      </Canvas>
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-500 ${
        disabled
          ? 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 opacity-50'
          : isListening 
            ? 'bg-gradient-to-r from-pink-200/40 to-pink-400/40 scale-110' 
            : isSpeaking 
              ? 'bg-gradient-to-r from-purple-400/20 to-blue-400/20' 
              : 'bg-gradient-to-r from-pink-200/20 to-pink-100/20'
      }`} />
      {/* Additional glow layers for listening state */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-pink-200/20 blur-2xl scale-125 -z-20 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-pink-100/15 blur-3xl scale-150 -z-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
} 