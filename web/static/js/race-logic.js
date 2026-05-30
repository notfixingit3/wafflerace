// Pure functions for race mechanics - easily testable

export const VISUAL_CLAMP_START = 0.68;
export const VISUAL_CLAMP_RELEASE = 0.92;
export const VISUAL_MAX_DURING_CLAMP = 0.81;

export const BASE_JITTER_INTERVAL = 90;
export const FINAL_PHASE_JITTER_MULTIPLIER = 0.6;

// === Race Creation / Setup Logic ===
// These are extracted so they can be properly unit tested.

export function parseNames(input) {
  if (!input || typeof input !== 'string') return [];
  return input
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
}

export function validateRaceInput(names, duration) {
  const parsed = Array.isArray(names) ? names : parseNames(names);

  if (!parsed || parsed.length === 0) {
    return { valid: false, error: 'Please enter at least one name' };
  }
  if (parsed.length > 50) {
    return { valid: false, error: 'Maximum 50 participants allowed' };
  }

  const dur = Number(duration);
  if (!dur || dur < 10 || dur > 300) {
    return {
      valid: false,
      error: 'Duration must be between 10 and 300 seconds',
    };
  }

  return { valid: true };
}

export function buildCreateRacePayload(
  names,
  duration,
  boatCollection = 'default',
  bgCollection = 'default'
) {
  const parsed = Array.isArray(names) ? names : parseNames(names);
  const dur = Number(duration) || 30;

  const payload = {
    names: parsed,
    duration: dur,
  };

  // Only include collections if they are not the default
  if (boatCollection && boatCollection !== 'default') {
    payload.boatCollection = boatCollection;
  }
  if (bgCollection && bgCollection !== 'default') {
    payload.bgCollection = bgCollection;
  }

  return payload;
}

/**
 * Reads the race creation form values from a form element.
 * Keeps DOM access out of the core logic.
 */
export function getRaceFormValues(form) {
  if (!form) return null;

  const rawNames = form.querySelector('textarea[name="names"]')?.value || '';

  return {
    namesInput: parseNames(rawNames).join('\n'), // normalized
    duration:
      parseInt(form.querySelector('input[name="duration"]')?.value, 10) || 30,
    boatCollection: form.querySelector('#boat-collection')?.value || 'default',
    bgCollection:
      form.querySelector('#background-collection')?.value || 'default',
    theme: form.querySelector('#race-theme')?.value || 'default',
    webhook: form.querySelector('#webhook-url')?.value || '',
  };
}

/**
 * Builds the URL to redirect to after successfully creating a race.
 * Handles optional collection parameters cleanly.
 */
export function buildRaceRedirectUrl(
  raceId,
  names,
  duration,
  boatCollection = 'default',
  bgCollection = 'default',
  theme = 'default',
  webhook = ''
) {
  const nameParam = Array.isArray(names) ? names.join(',') : names;

  let url = `/race?id=${raceId}&names=${encodeURIComponent(nameParam)}&duration=${duration}`;

  if (boatCollection && boatCollection !== 'default') {
    url += `&collection=${encodeURIComponent(boatCollection)}`;
  }
  if (bgCollection && bgCollection !== 'default') {
    url += `&bg=${encodeURIComponent(bgCollection)}`;
  }
  if (theme && theme !== 'default') {
    url += `&theme=${encodeURIComponent(theme)}`;
  }
  if (webhook) {
    url += `&webhook=${encodeURIComponent(webhook)}`;
  }

  return url;
}

/**
 * Calls the backend to create a new race.
 * Returns an object indicating success or failure.
 */
export async function createRace(payload) {
  try {
    const res = await fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to create race');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Failed to start race. Please try again.' };
  }
}

/**
 * High-level orchestrator for the race creation flow.
 * Takes raw form values, validates, calls the API, and returns everything
 * needed for the UI to react (success + redirect URL, or error).
 *
 * This is the main function that should be used by the UI layer.
 */
export async function submitRaceCreation({
  namesInput,
  duration,
  boatCollection = 'default',
  bgCollection = 'default',
  theme = 'default',
  webhook = '',
}) {
  const nameList = parseNames(namesInput);
  const validation = validateRaceInput(nameList, duration);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const payload = buildCreateRacePayload(
    nameList,
    duration,
    boatCollection,
    bgCollection
  );
  const result = await createRace(payload);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const redirectUrl = buildRaceRedirectUrl(
    result.id,
    nameList,
    duration,
    boatCollection,
    bgCollection,
    theme,
    webhook
  );

  return { success: true, id: result.id, redirectUrl };
}

/**
 * Calculate visual progress for a boat, applying strong clamping for suspense.
 * @param {number} logicalProgress - 0 to 1 based on actual position
 * @param {number} progress - race progress 0 to 1
 * @returns {number} clamped visual progress
 */
export function calculateVisualProgress(
  logicalProgress,
  progress,
  avgProgress
) {
  // If avgProgress is not passed, fallback to simple pacing
  if (avgProgress === undefined) {
    avgProgress = progress;
  }

  // 1. Calculate the base visual center of the screen for this phase of the race
  let visualCenter = 0.1;
  if (progress < 0.5) {
    // Move from start position (10%) to the middle (50%)
    visualCenter = 0.1 + (progress / 0.5) * 0.4;
  } else if (progress < 0.85) {
    // Stay in the middle (50%)
    visualCenter = 0.5;
  } else {
    // Move from middle (50%) to finish area (90%)
    const t = (progress - 0.85) / 0.15;
    visualCenter = 0.5 + t * 0.4;
  }

  // 2. Position each boat relative to the average visual center
  const relativeDeviation = logicalProgress - avgProgress;

  // Scale the deviation so the pack spreads out nicely across the screen
  const spreadFactor = 1.3;
  let visProg = visualCenter + relativeDeviation * spreadFactor;

  // 3. Keep visual progress bounded safely between 0.02 and 0.98
  return Math.max(0.02, Math.min(0.98, visProg));
}

/**
 * Calculate next target speed with jitter rules.
 */
export function calculateTargetSpeed(
  baseSpeed,
  currentSpeed,
  progress,
  relativeProgress
) {
  const isFinalPhase = progress > 0.82;

  let mult = 0.32 + Math.random() * 1.8;

  // Base random surges/slowdowns
  if (Math.random() < 0.29) {
    mult = 3.0 + Math.random() * 2.4;
  }

  if (Math.random() < 0.17) {
    mult = 0.18 + Math.random() * 0.42;
  }

  if (isFinalPhase) {
    mult *= 1.35;
    if (Math.random() < 0.45) {
      mult = 3.8 + Math.random() * 3.2;
    }
  }

  // Active rubber-banding/dampening control loop for lead change-ups
  // We taper this effect off in the final phase so the winner can sprint away clean
  const pacingControlStrength = progress > 0.82 ? 0.35 : 1.0;

  if (relativeProgress > 0) {
    // If ahead of average, damp target speed
    const damp = Math.max(
      0.42,
      1.0 - relativeProgress * 2.6 * pacingControlStrength
    );
    mult *= damp;
  } else {
    // If behind average, boost target speed
    const boost = Math.min(
      2.5,
      1.0 + Math.abs(relativeProgress) * 3.2 * pacingControlStrength
    );
    mult *= boost;
  }

  let target = baseSpeed * mult;
  target = Math.max(baseSpeed * 0.12, Math.min(baseSpeed * 6.2, target));

  return target;
}

/**
 * Get jitter interval based on race phase.
 */
export function getJitterInterval(progress) {
  const isFinalPhase = progress > 0.82;
  if (isFinalPhase) {
    return (
      BASE_JITTER_INTERVAL * FINAL_PHASE_JITTER_MULTIPLIER + Math.random() * 55
    );
  }
  return BASE_JITTER_INTERVAL + Math.random() * 100;
}

// === Setup / Race Creation UI Helpers ===
// These are exported for testing and attached to window for the current classic-script templates.

const TEST_NAMES = [
  'Alice Thompson',
  'Marcus Rivera',
  'Sofia Patel',
  'Liam Chen',
  'Isabella Morales',
  'Noah Kim',
  'Olivia Santos',
  'Ethan Brooks',
  'Mia Delgado',
  'Lucas Harper',
  'Amelia Quinn',
  'Benjamin Cruz',
  'Charlotte Vega',
  'Daniel Ortiz',
  'Harper Singh',
];

export function fillTestNames() {
  const textarea = document.querySelector('textarea[name="names"]');
  const durationInput = document.getElementById('duration-input');

  if (!textarea) return;

  textarea.value = TEST_NAMES.join('\n');

  if (durationInput) {
    durationInput.value = 30;
  }
}

export function setDuration(seconds) {
  const durationInput = document.getElementById('duration-input');
  if (durationInput) {
    durationInput.value = seconds;
  }
}

// Make them available to the inline scripts in the templates
if (typeof window !== 'undefined') {
  window.fillTestNames = fillTestNames;
  window.setDuration = setDuration;
}

export function formatDisplayName(name, maxLength = 18, trimLength = 15) {
  const text = String(name || '');
  return text.length > maxLength ? text.slice(0, trimLength) + '...' : text;
}

export function getLeaders(waffles, limit = 3) {
  if (!Array.isArray(waffles)) return [];
  return [...waffles].sort((a, b) => b.x - a.x).slice(0, limit);
}

export function calculateVerticalSpacing(
  count,
  canvasHeight,
  paddingTop = 205,
  paddingBottom = 40
) {
  const availableHeight = canvasHeight - paddingTop - paddingBottom;
  return Math.max(3.2, Math.min(25, availableHeight / Math.max(1, count - 1)));
}

export function calculateAverageProgress(waffles, startX, finishLine) {
  if (!Array.isArray(waffles) || waffles.length === 0) return 0;
  const distance = finishLine - startX;
  if (distance <= 0) return 0;
  const sum = waffles.reduce((s, w) => s + (w.x - startX), 0);
  return sum / waffles.length / distance;
}

export function initWaffleState(
  name,
  index,
  { startX, y, baseSpeed, spriteIndex, phase, bobSpeed }
) {
  return {
    name: name,
    displayNameShort: name.length > 9 ? name.slice(0, 8) + '…' : name,
    x: startX,
    y: y,
    baseSpeed: baseSpeed,
    currentSpeed: baseSpeed,
    targetSpeed: baseSpeed,
    phase: phase !== undefined ? phase : Math.random() * Math.PI * 2,
    bobSpeed: bobSpeed !== undefined ? bobSpeed : 2.6 + Math.random() * 1.6,
    lastJitter: 0,
    finished: false,
    finishTime: 0,
    spriteIndex: spriteIndex !== undefined ? spriteIndex : index,
    tilt: 0,
  };
}

export function updateWafflePosition(
  waffle,
  dt,
  progress,
  avgProgress,
  startX,
  finishLine,
  now
) {
  if (waffle.finished) return { emitJitter: false };

  const isFinalPhase = progress > 0.82;
  const jitterInterval = getJitterInterval(progress);
  let emitJitter = false;
  let jitterCount = 0;

  if (now - waffle.lastJitter > jitterInterval) {
    const distance = finishLine - startX;
    const myProgress = distance > 0 ? (waffle.x - startX) / distance : 0;
    const relativeProgress = myProgress - avgProgress;
    const nextTarget = calculateTargetSpeed(
      waffle.baseSpeed,
      waffle.currentSpeed,
      progress,
      relativeProgress
    );

    if (Math.abs(nextTarget - waffle.currentSpeed) > waffle.baseSpeed * 1.4) {
      emitJitter = true;
      jitterCount = isFinalPhase ? 9 : 5;
    }

    waffle.targetSpeed = nextTarget;
    waffle.lastJitter = now;
  }

  const speedLerp = 0.22;
  waffle.currentSpeed += (waffle.targetSpeed - waffle.currentSpeed) * speedLerp;
  waffle.currentSpeed += (Math.random() - 0.5) * 0.032;

  const distance = finishLine - startX;
  const currentLogicalProgress =
    distance > 0 ? (waffle.x - startX) / distance : 0;
  const error = currentLogicalProgress - progress;
  const feedbackStrength =
    progress > 0.82 ? Math.max(0.1, 1.0 - (progress - 0.82) * 5.0) : 1.0;
  const feedbackFactor = Math.max(0.15, 1.0 - error * 1.6 * feedbackStrength);

  const accel = 1 + progress * 0.15;
  const move = waffle.currentSpeed * accel * dt * feedbackFactor;

  waffle.phase += waffle.bobSpeed * 0.016;
  waffle.tilt =
    Math.sin(waffle.phase * 0.9) * 3.5 +
    (waffle.currentSpeed - waffle.baseSpeed) * 0.018;
  waffle.x += move;

  return {
    emitJitter,
    jitterCount,
    isFinalPhase,
  };
}
