// Pure functions for race mechanics - easily testable

export const VISUAL_CLAMP_START = 0.68
export const VISUAL_CLAMP_RELEASE = 0.92
export const VISUAL_MAX_DURING_CLAMP = 0.81

export const BASE_JITTER_INTERVAL = 90
export const FINAL_PHASE_JITTER_MULTIPLIER = 0.6

/**
 * Calculate visual progress for a boat, applying strong clamping for suspense.
 * @param {number} logicalProgress - 0 to 1 based on actual position
 * @param {number} progress - race progress 0 to 1
 * @returns {number} clamped visual progress
 */
export function calculateVisualProgress(logicalProgress, progress) {
  let visProg = logicalProgress

  if (progress > VISUAL_CLAMP_START) {
    if (progress < VISUAL_CLAMP_RELEASE) {
      visProg = Math.min(logicalProgress, VISUAL_MAX_DURING_CLAMP)
    } else {
      const releaseT = (progress - VISUAL_CLAMP_RELEASE) / (1 - VISUAL_CLAMP_RELEASE)
      const maxVis = VISUAL_MAX_DURING_CLAMP + (releaseT * 0.19)
      visProg = Math.min(logicalProgress, maxVis)
    }
  }

  return Math.max(0, Math.min(1, visProg))
}

/**
 * Calculate next target speed with jitter rules.
 */
export function calculateTargetSpeed(baseSpeed, currentSpeed, progress, behindFactor) {
  const isFinalPhase = progress > 0.82

  let mult = 0.32 + Math.random() * 1.8

  if (behindFactor > 0.05 && Math.random() < 0.68) {
    mult = 2.3 + Math.random() * 2.6
  }

  if (Math.random() < 0.29) {
    mult = 3.0 + Math.random() * 2.4
  }

  if (Math.random() < 0.17) {
    mult = 0.18 + Math.random() * 0.42
  }

  if (isFinalPhase) {
    mult *= 1.35
    if (Math.random() < 0.45) {
      mult = 3.8 + Math.random() * 3.2
    }
  }

  let target = baseSpeed * mult
  target = Math.max(baseSpeed * 0.12, Math.min(baseSpeed * 6.2, target))

  return target
}

/**
 * Get jitter interval based on race phase.
 */
export function getJitterInterval(progress) {
  const isFinalPhase = progress > 0.82
  if (isFinalPhase) {
    return (BASE_JITTER_INTERVAL * FINAL_PHASE_JITTER_MULTIPLIER) + Math.random() * 55
  }
  return BASE_JITTER_INTERVAL + Math.random() * 100
}