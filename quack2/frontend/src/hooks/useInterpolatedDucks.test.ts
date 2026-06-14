import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { DuckState, useInterpolatedDucks } from './useInterpolatedDucks';

const duckA: DuckState = {
  id: 'a',
  name: 'A',
  x: 0,
  y: 0,
  z: 0,
  velocity: 5,
  color: 'red',
};

const duckA2: DuckState = {
  id: 'a',
  name: 'A',
  x: 0,
  y: 0,
  z: 10,
  velocity: 5,
  color: 'red',
};

const duckB: DuckState = {
  id: 'b',
  name: 'B',
  x: 5,
  y: 0,
  z: 0,
  velocity: 3,
  color: 'blue',
};

function TestHarness({ ducks, onRender }: { ducks: DuckState[]; onRender: (_ducks: DuckState[]) => void }) {
  const interpolated = useInterpolatedDucks(ducks);

  useEffect(() => {
    onRender(interpolated);
  }, [interpolated, onRender]);

  return null;
}

describe('useInterpolatedDucks', () => {
  let nowValue: number;
  let rafCallbacks: FrameRequestCallback[];
  let nextRafId: number;

  beforeEach(() => {
    nowValue = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => nowValue);
    rafCallbacks = [];
    nextRafId = 1;

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      const id = nextRafId++;
      rafCallbacks.push(cb);
      return id;
    };

    globalThis.cancelAnimationFrame = () => {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function triggerRaf(time = nowValue) {
    const callbacks = rafCallbacks.splice(0);
    act(() => {
      callbacks.forEach((cb) => {
        cb(time);
      });
    });
  }

  function harness(props: { ducks: DuckState[]; onRender: (_ducks: DuckState[]) => void }) {
    return createElement(TestHarness, props);
  }

  it('interpolates positions between two server states based on elapsed time', () => {
    const renders: DuckState[][] = [];
    const onRender = (d: DuckState[]) => renders.push(d);

    nowValue = 0;
    const { rerender } = render(harness({ ducks: [duckA], onRender }));
    triggerRaf(0);

    let latest = renders[renders.length - 1];
    expect(latest).toHaveLength(1);
    expect(latest[0].z).toBe(0);

    nowValue = 100;
    rerender(harness({ ducks: [duckA2], onRender }));

    nowValue = 50;
    triggerRaf(50);

    latest = renders[renders.length - 1];
    expect(latest[0].z).toBe(5);
    expect(latest[0].x).toBe(0);
    expect(latest[0].y).toBe(0);
  });

  it('shows newly appeared ducks at their current state', () => {
    const renders: DuckState[][] = [];
    const onRender = (d: DuckState[]) => renders.push(d);

    nowValue = 0;
    const { rerender } = render(harness({ ducks: [duckA], onRender }));
    triggerRaf(0);

    nowValue = 100;
    rerender(harness({ ducks: [duckA2, duckB], onRender }));

    nowValue = 50;
    triggerRaf(50);

    const latest = renders[renders.length - 1];
    expect(latest).toHaveLength(2);
    expect(latest.find((d) => d.id === 'a')?.z).toBe(5);
    expect(latest.find((d) => d.id === 'b')?.z).toBe(0);
  });

  it('drops ducks that are missing from the current server state', () => {
    const renders: DuckState[][] = [];
    const onRender = (d: DuckState[]) => renders.push(d);

    nowValue = 0;
    const { rerender } = render(harness({ ducks: [duckA, duckB], onRender }));
    triggerRaf(0);

    nowValue = 100;
    rerender(harness({ ducks: [duckA2], onRender }));

    nowValue = 50;
    triggerRaf(50);

    const latest = renders[renders.length - 1];
    expect(latest).toHaveLength(1);
    expect(latest[0].id).toBe('a');
    expect(latest[0].z).toBe(5);
  });
});
