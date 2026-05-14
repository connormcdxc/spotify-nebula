"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Float, Stars as DreiStars } from "@react-three/drei";
import { Stars } from "./Stars";
import { Suspense, useState, useEffect } from "react";
import * as THREE from "three";

interface NebulaSceneProps {
  data: any[];
  onSelect: (star: any) => void;
  selectedStar: any;
}

export function NebulaScene({ data, onSelect, selectedStar }: NebulaSceneProps) {
  const [bgColor, setBgColor] = useState(new THREE.Color("#000000"));

  // Smoothly transition background color
  // In a real app we'd extract colors from album art, here we'll simulate or use a prop
  useEffect(() => {
    if (selectedStar) {
      // For now, let's just shift to a color based on valence if we don't have dominant color extractor yet
      const color = new THREE.Color();
      if (selectedStar.valence < 0.5) {
        color.setHSL(0.7, 0.5, 0.05); // Deep blue/purple
      } else {
        color.setHSL(0.05, 0.5, 0.05); // Deep gold/red
      }
      setBgColor(color);
    }
  }, [selectedStar]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 0 }}>
      <Canvas dpr={[1, 2]}>
        <color attach="background" args={[bgColor.r, bgColor.g, bgColor.b]} />
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={60} />
          <OrbitControls 
            enablePan={false} 
            maxDistance={200} 
            minDistance={10}
            autoRotate
            autoRotateSpeed={0.5}
          />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
             <Stars data={data} onSelect={onSelect} selectedStar={selectedStar} />
          </Float>

          {/* Background decoration stars */}
          <DreiStars radius={300} depth={60} count={10000} factor={7} saturation={0} fade speed={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}
