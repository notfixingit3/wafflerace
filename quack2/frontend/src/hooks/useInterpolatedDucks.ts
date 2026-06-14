'use client';

import { useEffect, useRef, useState } from 'react';

export type DuckState = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  velocity: number;
  color: string;
};

type Snapshot = {
  ducks: DuckState[];
  receivedAt: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateDucks(
  previous: Snapshot,
  current: Snapshot,
  now: number,
): DuckState[] {
  const duration = current.receivedAt - previous.receivedAt;
  const t =
    duration > 0
      ? Math.min(1, Math.max(0, (now - previous.receivedAt) / duration))
      : 1;

  const previousById = new Map(previous.ducks.map((duck) => [duck.id, duck]));

  return current.ducks.map((duck) => {
    const prevDuck = previousById.get(duck.id);
    if (!prevDuck) {
      return duck;
    }

    return {
      ...duck,
      x: lerp(prevDuck.x, duck.x, t),
      y: lerp(prevDuck.y, duck.y, t),
      z: lerp(prevDuck.z, duck.z, t),
    };
  });
}

export function useInterpolatedDucks(ducks: DuckState[]): DuckState[] {
  const [renderDucks, setRenderDucks] = useState<DuckState[]>(ducks);
  const previousRef = useRef<Snapshot | null>(null);
  const currentRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    const snapshot: Snapshot = {
      ducks,
      receivedAt: Date.now(),
    };

    if (currentRef.current === null) {
      previousRef.current = snapshot;
    } else {
      previousRef.current = currentRef.current;
    }
    currentRef.current = snapshot;
  }, [ducks]);

  useEffect(() => {
    let rafId = 0;
    let active = true;

    const tick = () => {
      if (!active) {
        return;
      }

      const previous = previousRef.current;
      const current = currentRef.current;

      if (!previous || !current) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const interpolated = interpolateDucks(previous, current, Date.now());
      setRenderDucks(interpolated);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  return renderDucks;
}
