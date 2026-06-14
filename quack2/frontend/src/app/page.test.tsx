/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

const mockSendCommand = vi.fn();

vi.mock('@/hooks/useRaceSocket', () => ({
  useRaceSocket: () => ({
    connected: true,
    ducks: [
      { id: 'duck-1', name: 'Duck-1', x: 0, y: 0, z: 10, velocity: 5, color: '#ff0000' },
      { id: 'duck-2', name: 'Duck-2', x: 10, y: 0, z: 20, velocity: 5, color: '#00ff00' },
    ],
    winner: null,
    finished: false,
    sendCommand: mockSendCommand,
  }),
}));

describe('Control Panel', () => {
  beforeEach(() => {
    mockSendCommand.mockClear();
  });

  it('renders connection status', () => {
    render(<Home />);
    expect(screen.getByText('Connected')).toBeDefined();
  });

  it('renders duck count', () => {
    render(<Home />);
    expect(screen.getByText('Ducks: 2')).toBeDefined();
  });

  it('renders all control buttons', () => {
    render(<Home />);
    expect(screen.getByText('Spawn Duck')).toBeDefined();
    expect(screen.getByText('Remove Last Duck')).toBeDefined();
    expect(screen.getByText('Start Race')).toBeDefined();
    expect(screen.getByText('Pause Race')).toBeDefined();
    expect(screen.getByText('Reset Race')).toBeDefined();
  });

  it('calls sendCommand with "spawn" when Spawn Duck is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText('Spawn Duck'));
    expect(mockSendCommand).toHaveBeenCalledWith('spawn');
  });

  it('calls sendCommand with "remove" when Remove Last Duck is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText('Remove Last Duck'));
    expect(mockSendCommand).toHaveBeenCalledWith('remove');
  });

  it('calls sendCommand with "start" when Start Race is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText('Start Race'));
    expect(mockSendCommand).toHaveBeenCalledWith('start');
  });

  it('calls sendCommand with "pause" when Pause Race is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText('Pause Race'));
    expect(mockSendCommand).toHaveBeenCalledWith('pause');
  });

  it('calls sendCommand with "reset" when Reset Race is clicked', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText('Reset Race'));
    expect(mockSendCommand).toHaveBeenCalledWith('reset');
  });

  it('displays overlay URL', () => {
    render(<Home />);
    const link = screen.getByText('http://localhost:3000/overlay');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('http://localhost:3000/overlay');
  });
});
