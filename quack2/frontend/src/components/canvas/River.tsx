'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function createWaterTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0066ff');
  gradient.addColorStop(0.5, '#0099cc');
  gradient.addColorStop(1, '#00ccaa');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);

  return texture;
}

export default function River() {
  const texture = useMemo(createWaterTexture, []);

  useFrame((_, delta) => {
    if (texture) {
      texture.offset.y -= delta * 0.1;
    }
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, 100]}
    >
      <planeGeometry args={[60, 240]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? undefined : '#0088aa'}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}
