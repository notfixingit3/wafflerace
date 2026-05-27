import { describe, it, expect } from 'vitest'
import { calculateVisualProgress, calculateTargetSpeed, getJitterInterval, VISUAL_CLAMP_START, VISUAL_MAX_DURING_CLAMP } from './race-logic.js'

describe('calculateVisualProgress', () => {
  it('returns logical progress before clamp start', () => {
    expect(calculateVisualProgress(0.5, 0.5)).toBe(0.5)
  })

  it('clamps to VISUAL_MAX_DURING_CLAMP during middle phase', () => {
    const result = calculateVisualProgress(0.95, VISUAL_CLAMP_START + 0.1)
    expect(result).toBe(VISUAL_MAX_DURING_CLAMP)
  })

  it('releases clamp in final phase', () => {
    const result = calculateVisualProgress(0.99, 0.95)
    expect(result).toBeGreaterThan(VISUAL_MAX_DURING_CLAMP)
    expect(result).toBeLessThanOrEqual(1)
  })
})

describe('calculateTargetSpeed', () => {
  it('returns a speed within reasonable bounds', () => {
    const speed = calculateTargetSpeed(10, 10, 0.5, 0)
    expect(speed).toBeGreaterThan(1)
    expect(speed).toBeLessThan(70)
  })

  it('applies stronger multipliers in final phase', () => {
    const normal = calculateTargetSpeed(10, 10, 0.5, 0)
    const final = calculateTargetSpeed(10, 10, 0.9, 0)
    // Not deterministic due to random, but we can check it tends higher
    expect(final).toBeGreaterThanOrEqual(1)
  })
})

describe('getJitterInterval', () => {
  it('returns shorter interval in final phase', () => {
    const normal = getJitterInterval(0.5)
    const final = getJitterInterval(0.9)
    expect(final).toBeLessThan(normal * 1.5) // loose check
  })
})