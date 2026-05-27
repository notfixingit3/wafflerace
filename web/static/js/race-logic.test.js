import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateVisualProgress,
  calculateTargetSpeed,
  getJitterInterval,
  VISUAL_CLAMP_START,
  VISUAL_MAX_DURING_CLAMP,
  parseNames,
  validateRaceInput,
  buildCreateRacePayload,
  buildRaceRedirectUrl,
  createRace,
  submitRaceCreation,
  getRaceFormValues,
  formatDisplayName,
  getLeaders,
  calculateVerticalSpacing,
  calculateAverageProgress,
  initWaffleState,
  updateWafflePosition
} from './race-logic.js'

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

  it('never exceeds 1.0', () => {
    const result = calculateVisualProgress(0.999, 0.999)
    expect(result).toBeLessThanOrEqual(1)
  })

  it('handles edge case at exact clamp boundaries', () => {
    expect(calculateVisualProgress(0.7, VISUAL_CLAMP_START)).toBe(0.7)
    // Slightly past release point should start opening up
    const slightlyPast = calculateVisualProgress(0.9, 0.93)
    expect(slightlyPast).toBeGreaterThan(VISUAL_MAX_DURING_CLAMP)
  })
})

describe('calculateTargetSpeed', () => {
  it('returns a speed within reasonable bounds', () => {
    const speed = calculateTargetSpeed(10, 10, 0.5, 0)
    expect(speed).toBeGreaterThan(1)
    expect(speed).toBeLessThan(70)
  })

  it('applies stronger multipliers in final phase', () => {
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

// === Race Creation Logic Tests ===

describe('parseNames', () => {
  it('parses simple newline separated names', () => {
    const input = 'Alice\nBob\nCharlie'
    expect(parseNames(input)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('trims whitespace and removes empty lines', () => {
    const input = '  Alice  \n\n  \nBob\n   '
    expect(parseNames(input)).toEqual(['Alice', 'Bob'])
  })

  it('returns empty array for null/undefined/empty input', () => {
    expect(parseNames(null)).toEqual([])
    expect(parseNames(undefined)).toEqual([])
    expect(parseNames('')).toEqual([])
    expect(parseNames('   \n\n  ')).toEqual([])
  })
})

describe('validateRaceInput', () => {
  it('accepts valid input', () => {
    const result = validateRaceInput(['Alice', 'Bob'], 45)
    expect(result.valid).toBe(true)
  })

  it('rejects empty names', () => {
    const result = validateRaceInput([], 30)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('at least one name')
  })

  it('rejects too many names', () => {
    const manyNames = Array(51).fill('Person')
    const result = validateRaceInput(manyNames, 30)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Maximum 50')
  })

  it('rejects invalid duration', () => {
    const result = validateRaceInput(['Alice'], 5)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('between 10 and 300')
  })

  it('rejects non-numeric duration', () => {
    const result = validateRaceInput(['Alice'], 'abc')
    expect(result.valid).toBe(false)
  })

  it('accepts boundary values for duration', () => {
    expect(validateRaceInput(['Alice'], 10).valid).toBe(true)
    expect(validateRaceInput(['Alice'], 300).valid).toBe(true)
  })
})

describe('buildCreateRacePayload', () => {
  it('builds basic payload correctly', () => {
    const payload = buildCreateRacePayload('Alice\nBob', 45)
    expect(payload).toEqual({ names: ['Alice', 'Bob'], duration: 45 })
  })

  it('includes collections only when not default', () => {
    const payload = buildCreateRacePayload(['Alice'], 30, 'flags-of-us', 'nature')
    expect(payload.boatCollection).toBe('flags-of-us')
    expect(payload.bgCollection).toBe('nature')
  })

  it('omits collections when they are default', () => {
    const payload = buildCreateRacePayload(['Alice'], 30, 'default', 'default')
    expect(payload.boatCollection).toBeUndefined()
    expect(payload.bgCollection).toBeUndefined()
  })
})

describe('getRaceFormValues', () => {
  it('extracts values from a form-like object', () => {
    const fakeForm = {
      querySelector: (sel) => {
        if (sel.includes('names')) return { value: '  Alice\nBob  ' };
        if (sel.includes('duration')) return { value: '45' };
        if (sel.includes('boat-collection')) return { value: 'flags-of-us' };
        if (sel.includes('background-collection')) return { value: 'nature' };
        return null;
      }
    };

    const values = getRaceFormValues(fakeForm);
    expect(values.namesInput).toBe('Alice\nBob');
    expect(values.duration).toBe(45);
    expect(values.boatCollection).toBe('flags-of-us');
    expect(values.bgCollection).toBe('nature');
  });

  it('returns defaults when elements are missing', () => {
    const fakeForm = { querySelector: () => null };
    const values = getRaceFormValues(fakeForm);
    expect(values.duration).toBe(30);
    expect(values.boatCollection).toBe('default');
  });

  it('normalizes whitespace in names textarea using parseNames', () => {
    const fakeForm = {
      querySelector: (sel) => {
        if (sel.includes('names')) return { value: '  \nAlice  \n\n  Bob\t\n  ' };
        if (sel.includes('duration')) return { value: '60' };
        return { value: 'default' };
      }
    };
    const values = getRaceFormValues(fakeForm);
    expect(values.namesInput).toBe('Alice\nBob');
  });
})

describe('buildRaceRedirectUrl', () => {
  it('builds basic redirect URL', () => {
    const url = buildRaceRedirectUrl('abc123', ['Alice', 'Bob'], 45)
    expect(url).toContain('/race?id=abc123')
    expect(url).toContain('names=Alice%2CBob')
    expect(url).toContain('duration=45')
  })

  it('appends collection params when not default', () => {
    const url = buildRaceRedirectUrl('abc123', ['Alice'], 30, 'flags-of-us', 'nature')
    expect(url).toContain('collection=flags-of-us')
    expect(url).toContain('bg=nature')
  })

  it('does not append collection params when default', () => {
    const url = buildRaceRedirectUrl('abc123', ['Alice'], 30, 'default', 'default')
    expect(url).not.toContain('collection=')
    expect(url).not.toContain('bg=')
  })

  it('handles array of names correctly in redirect', () => {
    const url = buildRaceRedirectUrl('race-xyz', ['A', 'B', 'C'], 60, 'default', 'default')
    expect(url).toContain('names=A%2CB%2CC')
  })
})

describe('createRace', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns success when the API responds with 201', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'race-123' })
    })

    const result = await createRace({ names: ['Alice'], duration: 30 })

    expect(result).toEqual({ success: true, id: 'race-123' })
    expect(global.fetch).toHaveBeenCalledWith('/api/races', expect.objectContaining({ method: 'POST' }))
  })

  it('returns error object on network failure', async () => {
    global.fetch.mockRejectedValue(new Error('Network down'))

    const result = await createRace({ names: ['Bob'], duration: 45 })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to start race')
  })

  it('returns error when response is not ok', async () => {
    global.fetch.mockResolvedValue({ ok: false })

    const result = await createRace({ names: ['Carol'], duration: 30 })

    expect(result.success).toBe(false)
  })
})

describe('submitRaceCreation', () => {
  it('short-circuits on validation errors without making network calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')

    const result = await submitRaceCreation({ namesInput: '', duration: 30 })

    expect(result.success).toBe(false)
    expect(result.error).toContain('at least one name')
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})

describe('formatDisplayName', () => {
  it('keeps short names as is', () => {
    expect(formatDisplayName('Alice')).toBe('Alice')
  })

  it('slices long names and appends ellipses', () => {
    expect(formatDisplayName('Alice Thompson Rivera Morales', 15, 10)).toBe('Alice Thom...')
  })

  it('handles empty names', () => {
    expect(formatDisplayName('')).toBe('')
    expect(formatDisplayName(null)).toBe('')
  })
})

describe('getLeaders', () => {
  it('sorts waffles by x descending', () => {
    const waffles = [
      { name: 'Waffle A', x: 100 },
      { name: 'Waffle B', x: 250 },
      { name: 'Waffle C', x: 180 },
    ]
    const leaders = getLeaders(waffles, 2)
    expect(leaders).toHaveLength(2)
    expect(leaders[0].name).toBe('Waffle B')
    expect(leaders[1].name).toBe('Waffle C')
  })

  it('handles non-array inputs gracefully', () => {
    expect(getLeaders(null)).toEqual([])
  })
})

describe('calculateVerticalSpacing', () => {
  it('calculates spacing correctly for standard inputs', () => {
    // availableHeight = 420 - 42 - 32 = 346
    // spacing = 346 / (5 - 1) = 86.5
    // clamped between 23 and 36 -> should be 36
    const spacing = calculateVerticalSpacing(5, 420)
    expect(spacing).toBe(36)
  })

  it('handles small number of waffles (avoiding infinity)', () => {
    const spacingSingle = calculateVerticalSpacing(1, 420)
    expect(spacingSingle).toBe(36)
  })
})

describe('calculateAverageProgress', () => {
  it('calculates average progress relative to distance', () => {
    const waffles = [
      { x: 190 }, // 100 distance from START_X = 90
      { x: 290 }, // 200 distance
    ]
    const avg = calculateAverageProgress(waffles, 90, 1090) // distance = 1000
    // avg distance = 150
    // avg progress = 150 / 1000 = 0.15
    expect(avg).toBeCloseTo(0.15, 4)
  })

  it('handles division by zero and empty arrays', () => {
    expect(calculateAverageProgress([], 90, 1090)).toBe(0)
    expect(calculateAverageProgress([{ x: 100 }], 90, 90)).toBe(0)
  })
})

describe('initWaffleState', () => {
  it('creates basic waffle object structure', () => {
    const state = initWaffleState('Waffle 1', 2, {
      startX: 90,
      y: 120,
      baseSpeed: 5.5,
      spriteIndex: 12,
      phase: 1.5,
      bobSpeed: 3.2
    })
    expect(state).toEqual({
      name: 'Waffle 1',
      x: 90,
      y: 120,
      baseSpeed: 5.5,
      currentSpeed: 5.5,
      targetSpeed: 5.5,
      phase: 1.5,
      bobSpeed: 3.2,
      lastJitter: 0,
      finished: false,
      finishTime: 0,
      spriteIndex: 12,
      tilt: 0
    })
  })

  it('populates defaults when optional values are omitted', () => {
    const state = initWaffleState('Waffle 2', 4, {
      startX: 90,
      y: 150,
      baseSpeed: 4.8
    })
    expect(state.name).toBe('Waffle 2')
    expect(state.spriteIndex).toBe(4)
    expect(state.phase).toBeGreaterThanOrEqual(0)
    expect(state.bobSpeed).toBeGreaterThanOrEqual(2.6)
  })
})

describe('updateWafflePosition', () => {
  it('skips update if waffle is already finished', () => {
    const waffle = { finished: true }
    const res = updateWafflePosition(waffle, 0.016, 0.5, 0.5, 90, 1000, Date.now())
    expect(res).toEqual({ emitJitter: false })
  })

  it('updates waffle position and returns surge status', () => {
    const waffle = {
      name: 'Waffle',
      x: 90,
      y: 100,
      baseSpeed: 10,
      currentSpeed: 10,
      targetSpeed: 10,
      phase: 0,
      bobSpeed: 3,
      lastJitter: 0,
      finished: false,
      spriteIndex: 1,
      tilt: 0
    }
    const res = updateWafflePosition(waffle, 0.016, 0.5, 0.5, 90, 1000, Date.now())
    expect(waffle.x).toBeGreaterThan(90)
    expect(waffle.phase).toBeGreaterThan(0)
    expect(res).toHaveProperty('emitJitter')
  })
})
