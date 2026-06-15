'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createWebSocket } from './createWebSocket';

export interface DuckState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  velocity: number;
  color: string;
}

export interface RaceState {
  ducks: DuckState[];
  winner: DuckState | null;
  finished: boolean;
}

export interface UseRaceSocketReturn {
  connected: boolean;
  ducks: DuckState[];
  winner: DuckState | null;
  finished: boolean;
  sendCommand: (_action: string) => void;
}

const DEFAULT_WS_URL = 'ws://localhost:8080/ws';
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

function getWsUrl(): string {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  return DEFAULT_WS_URL;
}

export function useRaceSocket(): UseRaceSocketReturn {
  const [connected, setConnected] = useState(false);
  const [ducks, setDucks] = useState<DuckState[]>([]);
  const [winner, setWinner] = useState<DuckState | null>(null);
  const [finished, setFinished] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(BASE_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);

  const urlRef = useRef(getWsUrl());
  const connectRef = useRef<() => void>();

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const delay = reconnectDelayRef.current;
    reconnectTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY
      );
      connectRef.current?.();
    }, delay);
  }, []);

  connectRef.current = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    intentionalCloseRef.current = false;

    try {
      const ws = createWebSocket(urlRef.current);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        if (!mountedRef.current) return;
        setConnected(true);
        reconnectDelayRef.current = BASE_RECONNECT_DELAY;
      });

      ws.addEventListener('message', (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as RaceState | DuckState[] | unknown;
          if (Array.isArray(data)) {
            setDucks(data as DuckState[]);
            return;
          }
          if (data && typeof data === 'object') {
            const state = data as RaceState;
            setDucks(Array.isArray(state.ducks) ? state.ducks : []);
            setWinner(state.winner ?? null);
            setFinished(state.finished ?? false);
          }
        } catch {
          return;
        }
      });

      ws.addEventListener('close', () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsRef.current = null;

        if (!intentionalCloseRef.current) {
          scheduleReconnect();
        }
      });

      ws.addEventListener('error', () => {
        return;
      });
    } catch {
      if (mountedRef.current) {
        scheduleReconnect();
      }
    }
  }, [scheduleReconnect]);

  useEffect(() => {
    mountedRef.current = true;
    connectRef.current?.();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          reconnectDelayRef.current = BASE_RECONNECT_DELAY;
          connectRef.current?.();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const sendCommand = useCallback((_action: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: _action }));
    }
  }, []);

  return { connected, ducks, winner, finished, sendCommand };
}
