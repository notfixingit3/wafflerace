'use client';

import React from 'react';
import { Text } from '@react-three/drei';

export interface DuckProps {
  name: string;
  x: number;
  y: number;
  z: number;
  color: string;
}

export default function Duck({ name, x, y, z, color }: DuckProps): JSX.Element {
  return (
    <>
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[x, y + 2.5, z]} fontSize={1.2} color="white">
        {name}
      </Text>
    </>
  );
}
