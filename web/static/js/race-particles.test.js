import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem } from './race-particles.js';

describe('ParticleSystem', () => {
  let system;

  beforeEach(() => {
    system = new ParticleSystem();
  });

  it('initializes with an empty particle array', () => {
    expect(system.particles).toEqual([]);
  });

  it('emits standard particles on call', () => {
    system.emit(100, 200, 5);
    expect(system.particles).toHaveLength(5);
    
    // Check structure of first particle
    const p = system.particles[0];
    expect(p).toHaveProperty('x');
    expect(p).toHaveProperty('y');
    expect(p.vx).toBeLessThan(1);
    expect(p.vy).toBeGreaterThan(0.5);
    expect(p.life).toBeGreaterThan(20);
    expect(p.size).toBeGreaterThan(1);
  });

  it('emits default number of particles when count is omitted', () => {
    system.emit(100, 200);
    expect(system.particles).toHaveLength(6);
  });

  it('emits winner confetti', () => {
    system.emitWinnerConfetti(300, 150);
    expect(system.particles).toHaveLength(80);
    
    const p = system.particles[0];
    expect(p.color).toMatch(/^#f[ad]/); // either #facc15 or #fde047
  });

  it('updates active particles and filters out dead ones', () => {
    system.emit(100, 200, 1);
    const p = system.particles[0];
    const initialX = p.x;
    const initialY = p.y;
    const initialLife = p.life;

    system.update();

    expect(p.x).not.toBe(initialX);
    expect(p.y).not.toBe(initialY);
    expect(p.life).toBe(initialLife - 1);

    // Force expire the particle
    p.life = 0;
    system.update();
    expect(system.particles).toHaveLength(0);
  });

  it('draws particles on canvas context', () => {
    system.emit(100, 200, 2);
    
    // Mock the 2D canvas context
    const mockCtx = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: ''
    };

    system.draw(mockCtx);

    expect(mockCtx.beginPath).toHaveBeenCalledTimes(2);
    expect(mockCtx.arc).toHaveBeenCalledTimes(2);
    expect(mockCtx.fill).toHaveBeenCalledTimes(2);
  });

  it('clears all active particles', () => {
    system.emit(100, 200, 10);
    expect(system.particles).toHaveLength(10);
    system.clear();
    expect(system.particles).toHaveLength(0);
  });
});
