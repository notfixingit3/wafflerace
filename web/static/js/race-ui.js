/**
 * Wafflerace - UI and Controls Module
 */

/**
 * Hides control panels and options if spectator mode is active.
 */
export function initSpectatorMode(isSpectator) {
  if (isSpectator) {
    const startBtn = document.getElementById('start-btn');
    const peeBtn = document.getElementById('pee-btn');
    const controls = document.getElementById('race-controls');
    const nameOptions = document.getElementById('name-options');

    if (startBtn) startBtn.style.display = 'none';
    if (peeBtn) peeBtn.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (nameOptions) nameOptions.style.display = 'none';
  }
}

/**
 * Sets up fullscreen toggle logic for the canvas container card.
 */
export function initFullscreen(canvas) {
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn && canvas) {
    fsBtn.addEventListener('click', () => {
      const container = canvas.parentElement; // the card-body
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
          container.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }
}

/**
 * Binds DOM click listeners to the race action buttons.
 */
export function bindControlButtons({ onStart, onPee, onToggleControls, onRunAgain }) {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', onStart);
  }

  const peeBtn = document.getElementById('pee-btn');
  if (peeBtn) {
    peeBtn.addEventListener('click', onPee);
  }

  const hideBtn = document.getElementById('hide-controls-btn');
  if (hideBtn) {
    hideBtn.addEventListener('click', onToggleControls);
  }

  const runAgainBtn = document.getElementById('run-again-btn');
  if (runAgainBtn) {
    runAgainBtn.addEventListener('click', onRunAgain);
  }
}

/**
 * Updates button and layout visibility when the race begins.
 */
export function updateUIForRaceStart() {
  const startBtn = document.getElementById('start-btn');
  const peeBtn = document.getElementById('pee-btn');
  const runAgainBtn = document.getElementById('run-again-btn');

  if (startBtn) startBtn.disabled = true;
  if (peeBtn) peeBtn.classList.remove('hidden');
  if (runAgainBtn) runAgainBtn.classList.add('hidden');
}

/**
 * Toggles warning color and text for the "I need to pee" pause state.
 */
export function updateUIForPeeMode(isPeeing) {
  const peeBtn = document.getElementById('pee-btn');
  if (!peeBtn) return;

  if (isPeeing) {
    peeBtn.textContent = 'Resume Race';
    peeBtn.classList.remove('btn-warning');
    peeBtn.classList.add('btn-success', 'pulse-warning');
  } else {
    peeBtn.textContent = 'I need to pee';
    peeBtn.classList.remove('btn-success', 'pulse-warning');
    peeBtn.classList.add('btn-warning');
  }
}

/**
 * Restores visibility of controls upon race completion.
 */
export function updateUIForFinish() {
  const startBtn = document.getElementById('start-btn');
  const peeBtn = document.getElementById('pee-btn');
  const runAgainBtn = document.getElementById('run-again-btn');

  if (startBtn) startBtn.disabled = true;
  if (peeBtn) peeBtn.classList.add('hidden');
  if (runAgainBtn) runAgainBtn.classList.remove('hidden');
}

/**
 * Handles showing or hiding controls panel with layout transition.
 */
export function toggleControlsVisibility(controlsHidden) {
  const startBtn = document.getElementById('start-btn');
  const peeBtn = document.getElementById('pee-btn');
  const runAgainBtn = document.getElementById('run-again-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const homeBtn = document.querySelector('a[href="/"]');
  const nameOptions = document.getElementById('name-options');
  const hideBtn = document.getElementById('hide-controls-btn');

  const els = [startBtn, peeBtn, runAgainBtn, fullscreenBtn, homeBtn, nameOptions].filter(Boolean);

  if (controlsHidden) {
    els.forEach((el) => el.classList.remove('hidden'));
    if (hideBtn) hideBtn.textContent = 'Hide Controls';
  } else {
    els.forEach((el) => {
      // Don't hide buttons that are naturally hidden at this stage
      if (el === peeBtn && peeBtn.classList.contains('hidden')) return;
      if (el === runAgainBtn && runAgainBtn.classList.contains('hidden')) return;
      el.classList.add('hidden');
    });
    if (hideBtn) hideBtn.textContent = 'Show Controls';
  }
}
