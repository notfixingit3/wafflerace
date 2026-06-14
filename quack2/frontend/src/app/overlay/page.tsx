'use client';

import React from 'react';
import { useRaceSocket } from '@/hooks/useRaceSocket';
import { useInterpolatedDucks } from '@/hooks/useInterpolatedDucks';
import RaceScene from '@/components/canvas/RaceScene';
import River from '@/components/canvas/River';
import Duck from '@/components/canvas/Duck';

const overlayStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
};

const disconnectedStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  fontSize: '2rem',
  fontWeight: 'bold',
  zIndex: 10,
};

export default function OverlayPage() {
  const { connected, ducks } = useRaceSocket();
  const interpolatedDucks = useInterpolatedDucks(ducks);

  const leadDuck =
    interpolatedDucks.length > 0
      ? interpolatedDucks.reduce((lead, duck) => (duck.z > lead.z ? duck : lead))
      : undefined;

  const leadDuckProp = leadDuck ? { x: leadDuck.x, z: leadDuck.z } : undefined;

  return (
    <div style={overlayStyle} data-testid="overlay-page">
      <RaceScene leadDuck={leadDuckProp}>
        <River />
        {interpolatedDucks.map((duck) => (
          <Duck
            key={duck.id}
            name={duck.name}
            x={duck.x}
            y={duck.y}
            z={duck.z}
            color={duck.color}
          />
        ))}
      </RaceScene>

      {!connected && (
        <div style={disconnectedStyle} role="status" aria-live="polite">
          Disconnected - reconnecting...
        </div>
      )}
    </div>
  );
}
