"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { StarShader } from "./StarShader";

export interface StarData {
  id: string;
  name: string;
  artist: string;
  energy: number;
  valence: number;
  tempo: number;
  danceability: number;
  [key: string]: any;
}

interface StarsProps {
  data: StarData[];
  onSelect: (star: StarData) => void;
  selectedStar: StarData | null;
}

export function Stars({ data, onSelect, selectedStar }: StarsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const { raycaster, mouse, camera } = useThree();
  const [hovered, setHovered] = useState<number | null>(null);

  // Map valence and energy to a wider, more vibrant color spectrum
  const getColor = (valence: number, energy: number) => {
    const color = new THREE.Color();
    // Use HSL for maximum vibrance
    // Hue: Valence (0 = Purple/Blue, 0.5 = Green/Cyan, 1.0 = Orange/Pink)
    // Saturation: High energy = more saturated
    // Lightness: High energy = brighter
    const hue = (valence * 0.7 + 0.6) % 1.0; // Shift hue for a cosmic feel
    const saturation = 0.4 + (energy * 0.6);
    const lightness = 0.4 + (energy * 0.4);
    
    color.setHSL(hue, saturation, lightness);
    return color;
  };

  const { positions, colors, sizes, linePositions } = useMemo(() => {
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);
    const sizes = new Float32Array(data.length);

    // 1. Calculate Spatial Positions based on Audio Features
    data.forEach((star, i) => {
      const spread = 60;
      const x = (star.valence - 0.5) * spread;
      const y = (star.energy - 0.5) * spread;
      const z = (star.danceability - 0.5) * spread;

      const noise = 2.0;
      const idHash = star.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      positions[i * 3] = x + (Math.sin(idHash) * noise);
      positions[i * 3 + 1] = y + (Math.cos(idHash) * noise);
      positions[i * 3 + 2] = z + (Math.sin(idHash * 0.5) * noise);

      const color = getColor(star.valence, star.energy);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Dramatically increase size variance (2.0 to 18.0 range)
      sizes[i] = 2.0 + Math.pow(star.energy, 2) * 16.0;
    });

    // 2. Calculate Constellation Lines
    const lineIndices: number[] = [];
    const maxConnections = 2;
    const maxDistSq = 400;

    for (let i = 0; i < data.length; i++) {
      const neighbors: { index: number; distSq: number }[] = [];
      for (let j = 0; j < data.length; j++) {
        if (i === j) continue;
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < maxDistSq) neighbors.push({ index: j, distSq });
      }
      neighbors.sort((a, b) => a.distSq - b.distSq);
      neighbors.slice(0, maxConnections).forEach(t => lineIndices.push(i, t.index));
    }

    const linePositions = new Float32Array(lineIndices.length * 3);
    lineIndices.forEach((idx, i) => {
      linePositions[i * 3] = positions[idx * 3];
      linePositions[i * 3 + 1] = positions[idx * 3 + 1];
      linePositions[i * 3 + 2] = positions[idx * 3 + 2];
    });

    return { positions, colors, sizes, linePositions };
  }, [data]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const rotation = time * 0.05;
    if (pointsRef.current) pointsRef.current.rotation.y = rotation;
    if (linesRef.current) linesRef.current.rotation.y = rotation;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(pointsRef.current!);
    if (intersects.length > 0) {
      const index = intersects[0].index;
      if (index !== undefined) {
        setHovered(index);
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
      }
    } else {
      setHovered(null);
      if (typeof document !== "undefined") document.body.style.cursor = "default";
    }
  });

  return (
    <group>
      <points ref={pointsRef} onClick={(e) => {
        e.stopPropagation();
        if (hovered !== null) onSelect(data[hovered]);
      }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          attach="material"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={StarShader.vertexShader}
          fragmentShader={StarShader.fragmentShader}
          uniforms={StarShader.uniforms}
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          color="#ffffff"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
