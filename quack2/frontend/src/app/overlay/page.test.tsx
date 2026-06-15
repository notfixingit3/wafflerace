/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OverlayPage from './page';

const mockUseRaceSocket = vi.fn();
const mockUseInterpolatedDucks = vi.fn();
const mockSendCommand = vi.fn();

vi.mock('@/hooks/useRaceSocket', () => ({
  useRaceSocket: () => mockUseRaceSocket(),
}));

vi.mock('@/hooks/useInterpolatedDucks', () => ({
  useInterpolatedDucks: (ducks: unknown[]) => mockUseInterpolatedDucks(ducks),
}));

vi.mock('@/components/canvas/RaceScene', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="race-scene">{children}</div>
  ),
}));

vi.mock('@/components/canvas/River', () => ({
  default: () => <div data-testid="river" />,
}));

vi.mock('@/components/canvas/Duck', () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="duck" data-name={name}>
      {name}
    </div>
  ),
}));

const sampleDucks = [
  { id: 'duck-1', name: 'Duck-1', x: -15, y: 0, z: 42, velocity: 5, color: '#ff0000' },
  { id: 'duck-2', name: 'Duck-2', x: 5, y: 0, z: 88, velocity: 5, color: '#00ff00' },
];

describe('OverlayPage', () => {
  beforeEach(() => {
    mockUseRaceSocket.mockReset();
    mockUseInterpolatedDucks.mockReset();
    mockSendCommand.mockReset();
  });

  it('renders ducks when data is available', () => {
    mockUseRaceSocket.mockReturnValue({
      connected: true,
      ducks: sampleDucks,
      winner: null,
      finished: false,
      sendCommand: mockSendCommand,
    });
    mockUseInterpolatedDucks.mockReturnValue(sampleDucks);

    render(<OverlayPage />);

    expect(screen.getByTestId('race-scene')).toBeInTheDocument();
    expect(screen.getByTestId('river')).toBeInTheDocument();

    const renderedDucks = screen.getAllByTestId('duck');
    expect(renderedDucks).toHaveLength(2);
    expect(renderedDucks[0]).toHaveAttribute('data-name', 'Duck-1');
    expect(renderedDucks[1]).toHaveAttribute('data-name', 'Duck-2');

    expect(mockUseInterpolatedDucks).toHaveBeenCalledWith(sampleDucks);
  });

  it('shows disconnected overlay when not connected', () => {
    mockUseRaceSocket.mockReturnValue({
      connected: false,
      ducks: [],
      winner: null,
      finished: false,
      sendCommand: mockSendCommand,
    });
    mockUseInterpolatedDucks.mockReturnValue([]);

    render(<OverlayPage />);

    expect(screen.getByText('Disconnected - reconnecting...')).toBeInTheDocument();
  });

  it('shows winner banner when finished', () => {
    mockUseRaceSocket.mockReturnValue({
      connected: true,
      ducks: sampleDucks,
      winner: null,
      finished: true,
      sendCommand: mockSendCommand,
    });
    mockUseInterpolatedDucks.mockReturnValue(sampleDucks);

    render(<OverlayPage />);

    expect(screen.getByText('Winner: Race Finished')).toBeInTheDocument();
  });

  it('shows winner banner with winner name', () => {
    mockUseRaceSocket.mockReturnValue({
      connected: true,
      ducks: sampleDucks,
      winner: sampleDucks[1],
      finished: true,
      sendCommand: mockSendCommand,
    });
    mockUseInterpolatedDucks.mockReturnValue(sampleDucks);

    render(<OverlayPage />);

    expect(screen.getByText('Winner: Duck-2')).toBeInTheDocument();
  });
});
