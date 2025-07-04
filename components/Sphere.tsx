'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SphereProps {
  isIdle: boolean;
  isSpeaking: boolean;
  amplitude: number;
}

function AnimatedSphere({ isIdle, isSpeaking, amplitude }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    if (isIdle) {
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

    // Update material properties
    if (materialRef.current) {
      if (isSpeaking) {
        materialRef.current.emissive.setHex(0x4f46e5);
        materialRef.current.emissiveIntensity = amplitude * 0.5;
      } else {
        materialRef.current.emissive.setHex(0x000000);
        materialRef.current.emissiveIntensity = 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#6366f1"
        roughness={0.1}
        metalness={0.8}
        emissive="#000000"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

function Scene({ isIdle, isSpeaking, amplitude }: SphereProps) {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      {/* Animated Sphere */}
      <AnimatedSphere isIdle={isIdle} isSpeaking={isSpeaking} amplitude={amplitude} />
    </>
  );
}

export function Sphere({ isIdle, isSpeaking, amplitude }: SphereProps) {
  return (
    <div className="w-80 h-80 relative">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Scene isIdle={isIdle} isSpeaking={isSpeaking} amplitude={amplitude} />
      </Canvas>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-xl -z-10" />
    </div>
  );
} 