'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface LeadDuck {
  x: number;
  z: number;
}

export interface RaceSceneProps {
  children?: React.ReactNode;
  leadDuck?: LeadDuck;
}

function CameraController({ leadDuck }: { leadDuck?: LeadDuck }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 100));

  useEffect(() => {
    camera.lookAt(target.current);
  }, [camera]);

  useFrame(() => {
    const desired = leadDuck
      ? new THREE.Vector3(leadDuck.x, 0, leadDuck.z)
      : new THREE.Vector3(0, 0, 100);
    target.current.lerp(desired, 0.05);
    camera.lookAt(target.current);
  });

  return null;
}

export default function RaceScene({ children, leadDuck }: RaceSceneProps) {
  return (
    <Canvas camera={{ position: [0, 80, 120], fov: 50 }}>
      <color attach="background" args={['#87CEEB']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.0} />
      <CameraController leadDuck={leadDuck} />
      {children}
    </Canvas>
  );
}
