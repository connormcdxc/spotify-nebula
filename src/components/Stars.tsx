"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { StarShader } from "./StarShader";

interface StarData {
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

  // Map valence to color
  const getColor = (valence: number) => {
    const color = new THREE.Color();
    if (valence < 0.5) {
      color.setHSL(0.7 + valence * 0.2, 0.8, 0.5);
    } else {
      color.setHSL(0.1 + (valence - 0.5) * 0.2, 0.8, 0.6);
    }
    return color;
  };

  const { positions, colors, sizes, linePositions } = useMemo(() => {
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);
    const sizes = new Float32Array(data.length);

    // 1. Calculate Spatial Positions based on Audio Features
    data.forEach((star, i) => {
      // Map features to -30 to 30 range
      const spread = 60;
      const x = (star.valence - 0.5) * spread;
      const y = (star.energy - 0.5) * spread;
      const z = (star.danceability - 0.5) * spread;

      const noise = 2.0;
      const idHash = star.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      positions[i * 3] = x + (Math.sin(idHash) * noise);
      positions[i * 3 + 1] = y + (Math.cos(idHash) * noise);
      positions[i * 3 + 2] = z + (Math.sin(idHash * 0.5) * noise);

      const color = getColor(star.valence);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 4.0 + star.energy * 8.0;
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
