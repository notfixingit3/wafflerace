import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRaceSocket, type DuckState } from './useRaceSocket';

// ---------------------------------------------------------------------------
// Mock WebSocket implementation
// ---------------------------------------------------------------------------
class MockWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  sentData: string[] = [];
  closed = false;

  constructor(_url: string) {
    super();
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  receiveMessage(data: string): void {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }

  send(data: string): void {
    this.sentData.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }
}

// ---------------------------------------------------------------------------
// Mock createWebSocket module
// ---------------------------------------------------------------------------
const sampleDucks: DuckState[] = [
  { id: 'duck-1', name: 'Duck-1', x: -15, y: 0, z: 42, velocity: 5, color: '#ff0000' },
  { id: 'duck-2', name: 'Duck-2', x: 5, y: 0, z: 88, velocity: 5, color: '#00ff00' },
];

const createWsMock = vi.fn();
vi.mock('./createWebSocket', () => ({
  createWebSocket: (...args: Parameters<typeof createWsMock>) => createWsMock(...args),
}));

function latestWs(): MockWebSocket {
  const results = createWsMock.mock.results;
  return results[results.length - 1].value as MockWebSocket;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useRaceSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createWsMock.mockImplementation((url: string) => new MockWebSocket(url));
  });

  afterEach(() => {
    createWsMock.mockReset();
    vi.useRealTimers();
  });

  it('connects and updates ducks when a message arrives', () => {
    const { result } = renderHook(() => useRaceSocket());

    expect(result.current.connected).toBe(false);
    expect(result.current.ducks).toEqual([]);
    expect(createWsMock).toHaveBeenCalledTimes(1);

    const ws = latestWs();
    act(() => {
      ws.triggerOpen();
    });
    expect(result.current.connected).toBe(true);

    act(() => {
      ws.receiveMessage(JSON.stringify(sampleDucks));
    });
    expect(result.current.ducks).toHaveLength(2);
    expect(result.current.ducks[0].id).toBe('duck-1');
    expect(result.current.ducks[1].z).toBe(88);
  });

  it('handles empty array from server gracefully', () => {
    renderHook(() => useRaceSocket());
    const ws = latestWs();

    act(() => {
      ws.triggerOpen();
      ws.receiveMessage(JSON.stringify([]));
    });

    expect(createWsMock).toHaveBeenCalledTimes(1);
  });

  it('sendCommand sends correct JSON', () => {
    const { result } = renderHook(() => useRaceSocket());
    const ws = latestWs();

    act(() => {
      ws.triggerOpen();
    });
    act(() => {
      result.current.sendCommand('spawn');
    });

    expect(ws.sentData).toHaveLength(1);
    expect(ws.sentData[0]).toBe(JSON.stringify({ action: 'spawn' }));
  });

  it('does not send when disconnected', () => {
    const { result } = renderHook(() => useRaceSocket());
    const ws = latestWs();

    act(() => {
      result.current.sendCommand('spawn');
    });

    expect(ws.sentData).toHaveLength(0);
  });

  it('reconnects after unexpected close with exponential backoff', () => {
    renderHook(() => useRaceSocket());

    expect(createWsMock).toHaveBeenCalledTimes(1);
    let ws = latestWs();

    act(() => {
      ws.triggerOpen();
    });
    act(() => {
      ws.close();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(createWsMock).toHaveBeenCalledTimes(2);

    ws = latestWs();
    act(() => {
      ws.triggerOpen();
    });
    act(() => {
      ws.close();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(createWsMock).toHaveBeenCalledTimes(3);
  });

  it('does not reconnect on intentional close (unmount)', () => {
    const { unmount } = renderHook(() => useRaceSocket());
    const ws = latestWs();

    act(() => {
      ws.triggerOpen();
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(createWsMock).toHaveBeenCalledTimes(1);
  });
});