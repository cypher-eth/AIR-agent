'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SphereProps {
  isIdle: boolean;
  isSpeaking: boolean;
  isListening: boolean; // This now represents the holding state
  amplitude: number;
}

function AnimatedSphere({ isIdle, isSpeaking, isListening, amplitude }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    if (isListening) {
      // Pulsing animation when listening (half speed)
      const pulseScale = 1 + Math.sin(time * 1.5) * 0.15;
      meshRef.current.scale.setScalar(pulseScale);
      
      // Gentle rotation
      meshRef.current.rotation.y = time * 0.1;
    } else if (isIdle) {
      // Gentle breathing animation
      const scale = 1 + Math.sin(time * 0.5) * 0.05;
      meshRef.current.scale.setScalar(scale);
      
      // Gentle rotation
      meshRef.current.rotation.y = time * 0.1;
    } else if (isSpeaking) {
      // Dynamic speaking animation based on amplitude
      const speakScale = 1 + amplitude * 0.3;
      const breathScale = 1 + Math.sin(time * 2) * 0.02;
      meshRef.current.scale.setScalar(speakScale * breathScale);
      
      // Faster rotation when speaking
      meshRef.current.rotation.y = time * 0.3;
      
      // Add some wobble
      meshRef.current.rotation.x = Math.sin(time * 3) * 0.1;
    }
  });

  return (
    <>
      {/* Inner glow sphere for listening state */}
      {isListening && (
        <mesh position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#f9a8d4"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Main sphere */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={isListening ? "#f9a8d4" : isSpeaking ? "#4f46e5" : "#6366f1"}
          roughness={0.1}
          metalness={0.8}
          emissive={isListening ? "#f9a8d4" : isSpeaking ? "#4f46e5" : "#000000"}
          emissiveIntensity={isListening ? 0.8 : isSpeaking ? amplitude * 0.5 : 0}
        />
      </mesh>
    </>
  );
}

export function Sphere({ isIdle, isSpeaking, isListening, amplitude }: SphereProps) {
  return (
    <div className="w-80 h-80 relative">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f9a8d4" />
        
        <AnimatedSphere isIdle={isIdle} isSpeaking={isSpeaking} isListening={isListening} amplitude={amplitude} />
      </Canvas>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-500 ${
        isListening 
          ? 'bg-gradient-to-r from-pink-200/40 to-pink-400/40 scale-110' 
          : isSpeaking 
            ? 'bg-gradient-to-r from-purple-400/20 to-blue-400/20' 
            : 'bg-gradient-to-r from-purple-400/10 to-blue-400/10'
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