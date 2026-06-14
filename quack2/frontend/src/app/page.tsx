'use client';

import React from 'react';
import { useRaceSocket } from '@/hooks/useRaceSocket';

export default function Home() {
  const { connected, ducks, winner, finished, sendCommand } = useRaceSocket();

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Quack 2.0 Control Panel</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <p>
          Status:{' '}
          <span style={{ color: connected ? 'green' : 'red', fontWeight: 'bold' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        <p>Ducks: {ducks.length}</p>
        {winner && <p>Winner: {winner}</p>}
        {finished && <p>Race finished</p>}
      </section>

      <section style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => sendCommand('spawn')} style={btnStyle}>
          Spawn Duck
        </button>
        <button type="button" onClick={() => sendCommand('remove')} style={btnStyle}>
          Remove Last Duck
        </button>
        <button type="button" onClick={() => sendCommand('start')} style={btnStyle}>
          Start Race
        </button>
        <button type="button" onClick={() => sendCommand('pause')} style={btnStyle}>
          Pause Race
        </button>
        <button type="button" onClick={() => sendCommand('reset')} style={btnStyle}>
          Reset Race
        </button>
      </section>

      <section>
        <p>
          Overlay URL:{' '}
          <a href="http://localhost:3000/overlay" target="_blank" rel="noopener noreferrer">
            http://localhost:3000/overlay
          </a>
        </p>
      </section>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: '4px',
  background: '#f5f5f5',
};
