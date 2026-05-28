// Wafflerace - Canvas Animation
import { initAudio, playSplash, playFinishChime } from './race-audio.js';
import { ParticleSystem } from './race-particles.js';
import {
  calculateVisualProgress,
  formatDisplayName,
  getLeaders,
  calculateVerticalSpacing,
  calculateAverageProgress,
  initWaffleState,
  updateWafflePosition
} from './race-logic.js';
import {
  drawLoadingProgressBar,
  drawParallaxBackgrounds,
  drawFinishLine,
  drawBoat
} from './race-render.js';
import {
  initSpectatorMode,
  initFullscreen,
  bindControlButtons,
  updateUIForRaceStart,
  updateUIForPeeMode,
  updateUIForFinish,
  toggleControlsVisibility
} from './race-ui.js';

(function () {
  const canvas = document.getElementById('race-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const names = window.RACE_NAMES || ['Waffle 1', 'Waffle 2'];
  const duration = window.RACE_DURATION || 25;

  let waffles = [];
  let startTime = null;
  let lastTime = null;
  let finished = false;
  let results = [];
  let paused = false;
  let pauseStartTime = null;
  let nameDisplayMode = 'short'; // 'full', 'short', or 'hidden'
  let controlsHidden = false;
  let frameTimes = [];
  let lastFps = 0;

  // === Configuration (centralized for maintainability) ===
  const TOTAL_BOAT_SPRITES = 50;
  const MAX_BG_IMAGES = 40; // supports default (20) + nature (30) + future collections

  // Jitter behavior
  const BASE_JITTER_INTERVAL = 90;
  const FINAL_PHASE_JITTER_MULTIPLIER = 0.6; // more frequent in final phase

  // === AI-Generated Boat Sprites (50 right-facing variants) ===
  const boatImages = [];
  // Mapping for collections that use human-readable names instead of boat-right-XX
  const FLAGS_OF_US_STATES = [
    'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware',
    'florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky',
    'louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi',
    'missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico',
    'new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania',
    'rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont',
    'virginia','washington','west-virginia','wisconsin','wyoming'
  ];

  // First 5 for the new Flags of the World collection (top countries by population)
  const FLAGS_OF_WORLD_FIRST = [
    'india', 'china', 'united-states', 'indonesia', 'pakistan'
  ];

  function getBoatBaseName(collection, index) {
    if (collection === 'flags-of-us') {
      return FLAGS_OF_US_STATES[index - 1] || `boat-right-${String(index).padStart(2, '0')}`;
    }
    if (collection === 'flags-of-world') {
      return FLAGS_OF_WORLD_FIRST[index - 1] || `boat-right-${String(index).padStart(2, '0')}`;
    }
    return `boat-right-${String(index).padStart(2, '0')}`;
  }

  function preloadBoatSprites() {
    const collection = window.RACE_BOAT_COLLECTION || 'default';

    for (let i = 1; i <= TOTAL_BOAT_SPRITES; i++) {
      const img = new Image();
      const base = getBoatBaseName(collection, i);

      // Prefer WebP (dramatically smaller file size) with PNG fallback
      img.src = `/assets/boats/collections/${collection}/webp/${base}.webp`;

      img.onerror = () => {
        img.onerror = null; // Prevent infinite loop if fallback also fails
        img.src = `/assets/boats/collections/${collection}/png/${base}.png`;
      };

      boatImages.push(img);
    }
  }
  preloadBoatSprites();

  // === Background images for parallax layers ===
  const bgImages = [];

  function preloadBackgrounds() {
    const collection = window.RACE_BACKGROUND_COLLECTION || 'default';

    for (let i = 1; i <= MAX_BG_IMAGES; i++) {
      const img = new Image();
      const base = `bg-river-${String(i).padStart(2, '0')}`;

      // Prefer WebP for better performance/size
      img.src = `/assets/backgrounds/collections/${collection}/webp/${base}.webp`;

      img.onerror = () => {
        img.onerror = null; // Prevent infinite loop if fallback also fails
        img.src = `/assets/backgrounds/collections/${collection}/jpg/${base}.jpg`;
      };

      bgImages.push(img);
    }
  }
  preloadBackgrounds();

  // Runtime selected parallax layers (far, mid, near/water)
  let parallaxLayers = [];

  // Particle system
  const particleSystem = new ParticleSystem();

  const FINISH_LINE = canvas.width - 80;
  const START_X = 90;

  function initWaffles() {
    waffles = [];
    results = [];
    finished = false;
    particleSystem.clear();

    // Randomly pick 3 distinct backgrounds for parallax (far / mid / water)
    const validBgs = bgImages.filter((img) => img.complete && img.width > 0);
    if (validBgs.length < 3) {
      while (validBgs.length < 3 && bgImages.length > 0) {
        validBgs.push(bgImages[validBgs.length % bgImages.length]);
      }
    }
    const shuffled = validBgs.slice().sort(() => Math.random() - 0.5);
    parallaxLayers = [
      { img: shuffled[0], speed: 7 }, // far - very slow
      { img: shuffled[1], speed: 18 }, // mid
      { img: shuffled[2], speed: 31 }, // near water - faster
    ];

    const distance = FINISH_LINE - START_X;
    const winnerSpeed = distance / duration;

    // Everyone else is slower than the winner
    const minMultiplier = 0.7;
    const maxMultiplier = 0.97;

    const paddingTop = 42;
    const paddingBottom = 32;
    const verticalSpacing = calculateVerticalSpacing(names.length, canvas.height, paddingTop, paddingBottom);

    names.forEach((name, i) => {
      const multiplier =
        minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
      const base = winnerSpeed * multiplier;
      const y = paddingTop + i * verticalSpacing;
      const spriteIndex = Math.floor(Math.random() * TOTAL_BOAT_SPRITES);

      waffles.push(initWaffleState(name, i, {
        startX: START_X,
        y,
        baseSpeed: base,
        spriteIndex
      }));
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const progress = startTime
      ? Math.min((Date.now() - startTime) / 1000 / duration, 1)
      : 0;

    const totalAssets = TOTAL_BOAT_SPRITES + MAX_BG_IMAGES;
    const loaded =
      boatImages.filter((b) => b.complete).length +
      bgImages.filter((b) => b.complete).length;
    const loadProgress = Math.min(1, loaded / totalAssets);

    // Show loading overlay until assets are ready
    if (loadProgress < 0.999 && !startTime) {
      drawLoadingProgressBar(ctx, canvas.width, canvas.height, loadProgress);
      return;
    }

    // === Parallax Background Layers (far → near) ===
    drawParallaxBackgrounds(ctx, canvas.width, canvas.height, parallaxLayers, startTime);

    // Particles (syrup drips / splashes)
    particleSystem.update();
    particleSystem.draw(ctx);

    // Finish line (late reveal)
    drawFinishLine(ctx, canvas.height, FINISH_LINE, progress);

    // Boats
    waffles.forEach((w) => {
      const bob = Math.sin(w.phase) * 2.5;

      const logicalProgress = (w.x - START_X) / (FINISH_LINE - START_X);
      const visProg = calculateVisualProgress(logicalProgress, progress);

      const visualX =
        START_X + (FINISH_LINE - START_X) * Math.max(0, Math.min(1, visProg));
      drawBoat(ctx, visualX, w.y, bob, w.name, w.spriteIndex, w.tilt, boatImages, nameDisplayMode);
    });

    // Update live leaderboard (item 8)
    updateLiveLeaderboard();
  }

  function updateLiveLeaderboard() {
    const container = document.getElementById('live-leaderboard');
    const list = document.getElementById('live-leaders-list');
    if (!container || !list || !startTime || finished) return;

    const sorted = getLeaders(waffles, 3);

    list.innerHTML = '';
    sorted.forEach((w, i) => {
      const div = document.createElement('div');
      div.className = 'flex justify-between text-xs';
      const name = document.createElement('span');
      name.textContent = `${i + 1}. ${formatDisplayName(w.name)}`;
      div.appendChild(name);
      list.appendChild(div);
    });

    container.classList.remove('hidden');
  }

  function update() {
    if (finished || paused || !startTime) return;

    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    let dt = 0;
    if (lastTime !== null) {
      dt = (now - lastTime) / 1000;
    } else {
      dt = 1 / 60; // first frame fallback
    }
    lastTime = now;

    const avgProgress = calculateAverageProgress(waffles, START_X, FINISH_LINE);

    waffles.forEach((w) => {
      if (w.finished) return;

      const updateResult = updateWafflePosition(w, dt, progress, avgProgress, START_X, FINISH_LINE, now);
      if (updateResult.emitJitter) {
        particleSystem.emit(w.x, w.y + 6, updateResult.jitterCount);
        if (updateResult.isFinalPhase) {
          playSplash(1.1);
        }
      }
    });

    // The race runs for the full duration.
    // When time expires, the boat that is farthest ahead wins.
    if (elapsed >= duration) {
      finished = true;

      // Build final results purely by position (no times)
      results = [...waffles]
        .sort((a, b) => b.x - a.x) // farthest = winner
        .map((w) => ({ name: w.name, spriteIndex: w.spriteIndex }));

      showResults();

      // Save result to backend for multi-device history (if we have a race ID)
      if (window.RACE_ID && results.length > 0) {
        fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            race_id: window.RACE_ID,
            winner_name: results[0].name,
          }),
        }).catch(() => {}); // fire and forget
      }
    }
  }

  function showResults() {
    const container = document.getElementById('results');
    const announcement = document.getElementById('winner-announcement');
    const winnerNameEl = document.getElementById('winner-name');
    const list = document.getElementById('results-list');

    list.innerHTML = '';
    container.classList.remove('hidden');
    
    updateUIForFinish();

    const top3 = results.slice(0, 3);
    const winner = top3[0];

    // Populate names on podium steps
    const p1Name = document.getElementById('podium-1st-name');
    const p2Name = document.getElementById('podium-2nd-name');
    const p3Name = document.getElementById('podium-3rd-name');

    if (p1Name) p1Name.textContent = winner ? winner.name : '—';
    
    if (p2Name) {
      if (results[1]) {
        p2Name.textContent = results[1].name;
        document.getElementById('podium-2nd').style.visibility = 'visible';
      } else {
        p2Name.textContent = '—';
        document.getElementById('podium-2nd').style.visibility = 'hidden';
      }
    }

    if (p3Name) {
      if (results[2]) {
        p3Name.textContent = results[2].name;
        document.getElementById('podium-3rd').style.visibility = 'visible';
      } else {
        p3Name.textContent = '—';
        document.getElementById('podium-3rd').style.visibility = 'hidden';
      }
    }

    // Render winner's boat sprite onto the winner canvas
    const winnerCanvas = document.getElementById('winner-boat-canvas');
    if (winnerCanvas && winner) {
      const wCtx = winnerCanvas.getContext('2d');
      wCtx.clearRect(0, 0, winnerCanvas.width, winnerCanvas.height);
      const img = boatImages[winner.spriteIndex];
      if (img && img.complete) {
        const targetHeight = 64;
        const scale = targetHeight / img.height;
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const cx = winnerCanvas.width / 2;
        const cy = winnerCanvas.height / 2;
        wCtx.save();
        wCtx.translate(cx, cy);
        wCtx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        wCtx.restore();
      } else {
        wCtx.save();
        wCtx.translate(winnerCanvas.width / 2, winnerCanvas.height / 2);
        wCtx.fillStyle = '#f4c95f';
        wCtx.beginPath();
        wCtx.arc(0, 0, 18, 0, Math.PI * 2);
        wCtx.fill();
        wCtx.restore();
      }
    }

    // Sequential podium reveal timers
    // 1. Reveal 3rd place podium (t = 600ms)
    setTimeout(() => {
      const p3 = document.getElementById('podium-3rd');
      if (p3 && results[2]) {
        p3.classList.remove('opacity-0', 'translate-y-4');
        p3.classList.add('opacity-100', 'translate-y-0', 'scale-100');
        playSplash(0.8);
      }
    }, 600);

    // 2. Reveal 2nd place podium (t = 1200ms)
    setTimeout(() => {
      const p2 = document.getElementById('podium-2nd');
      if (p2 && results[1]) {
        p2.classList.remove('opacity-0', 'translate-y-4');
        p2.classList.add('opacity-100', 'translate-y-0', 'scale-100');
        playSplash(0.9);
      }
    }, 1200);

    // 3. Reveal 1st place podium & winner details (t = 1800ms)
    setTimeout(() => {
      const p1 = document.getElementById('podium-1st');
      if (p1 && winner) {
        p1.classList.remove('opacity-0', 'translate-y-8');
        p1.classList.add('opacity-100', 'translate-y-0', 'scale-105');
      }

      if (announcement) {
        announcement.classList.remove('opacity-0');
        announcement.classList.add('opacity-100');
      }

      if (winnerNameEl && winner) {
        winnerNameEl.textContent = winner.name;
        winnerNameEl.classList.remove('opacity-0', 'scale-95');
        winnerNameEl.classList.add('opacity-100', 'scale-100');
      }

      // Confetti & Win Chime
      const rect = canvas.getBoundingClientRect();
      particleSystem.emitWinnerConfetti(rect.width / 2, rect.height / 2);
      playFinishChime();
    }, 1800);

    // 4. Reveal Rest of the Field & persistence controls (t = 2500ms)
    setTimeout(() => {
      // Full Standings list (4th place and below)
      if (results.length > 3) {
        const restHeader = document.createElement('h4');
        restHeader.className = 'text-sm font-semibold text-base-content/70 mb-3 px-1 tracking-wider';
        restHeader.textContent = 'REST OF THE FIELD';
        list.appendChild(restHeader);

        const restContainer = document.createElement('div');
        restContainer.className = 'space-y-1.5 max-h-[280px] overflow-auto pr-1';

        results.slice(3).forEach((r, index) => {
          const div = document.createElement('div');
          div.className = 'flex items-center gap-3 bg-base-200 px-4 py-2.5 rounded-xl text-sm';

          const rank = document.createElement('div');
          rank.className = 'badge badge-ghost badge-sm w-7 justify-center font-mono';
          rank.textContent = String(index + 4);

          const name = document.createElement('span');
          name.className = 'font-medium';
          name.textContent = r.name;

          div.append(rank, name);
          restContainer.appendChild(div);
        });

        list.appendChild(restContainer);
      } else {
        const message = document.createElement('div');
        message.className = 'text-center py-4 text-sm text-base-content/50';
        message.textContent = 'All racers placed on the podium.';
        list.appendChild(message);
      }

      // Save to local storage history
      if (results.length > 0) {
        saveRaceToHistory(results[0].name);
      }
      showRaceHistory();
    }, 2500);
  }

  // Utility: Copy winner name to clipboard
  function copyWinner() {
    if (!results || results.length === 0) return;
    const winner = results[0].name;
    navigator.clipboard.writeText(winner).then(() => {
      // Simple feedback
      const btns = document.querySelectorAll('button');
      btns.forEach((b) => {
        if (b.innerText.includes('Winner')) b.innerText = 'Copied!';
      });
      setTimeout(() => {
        btns.forEach((b) => {
          if (b.innerText === 'Copied!') b.innerText = 'Copy Winner Name';
        });
      }, 1400);
    });
  }

  // Utility: Copy full results as text
  function copyFullResults() {
    if (!results || results.length === 0) return;
    const text = results
      .map((r, i) => `${i + 1}. ${r.name}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const btns = document.querySelectorAll('button');
      btns.forEach((b) => {
        if (b.innerText.includes('Results')) b.innerText = 'Copied!';
      });
      setTimeout(() => {
        btns.forEach((b) => {
          if (b.innerText === 'Copied!') b.innerText = 'Copy Full Results';
        });
      }, 1400);
    });
  }

  function updateTimer() {
    if (!startTime || finished) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);

    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = remaining.toFixed(1) + 's';
    }
  }

  function loop() {
    const nowTimestamp = performance.now();
    while (frameTimes.length > 0 && frameTimes[0] <= nowTimestamp - 1000) {
      frameTimes.shift();
    }
    frameTimes.push(nowTimestamp);
    lastFps = frameTimes.length;

    try {
      update();
      draw();
      updateTimer();
    } catch (err) {
      console.error('[Wafflerace] Error in animation loop:', err);
    }

    if (!finished) {
      requestAnimationFrame(loop);
    } else {
      // Final timer update
      const timerEl = document.getElementById('timer');
      if (timerEl) timerEl.textContent = '0.0s';
    }
  }

  function startRace() {
    if (startTime) return;

    initAudio();
    startTime = Date.now();
    lastTime = null;
    paused = false;
    initWaffles();

    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = duration.toFixed(1) + 's';

    updateUIForRaceStart();
    loop();
  }

  function togglePee() {
    paused = !paused;
    updateUIForPeeMode(paused);

    if (paused) {
      pauseStartTime = Date.now();
    } else {
      // Adjust startTime to account for pause duration
      if (pauseStartTime) {
        const pauseDuration = Date.now() - pauseStartTime;
        startTime += pauseDuration;
        pauseStartTime = null;
      }
      loop(); // restart the animation loop
    }
  }

  function setNameDisplay(mode) {
    nameDisplayMode = mode;
    if (startTime && !finished) {
      draw();
    }
  }

  function toggleHideControls() {
    controlsHidden = !controlsHidden;
    toggleControlsVisibility(controlsHidden);
  }

  function saveRaceToHistory(winnerName) {
    try {
      const history = JSON.parse(
        localStorage.getItem('wafflerace_history') || '[]'
      );
      history.unshift({
        timestamp: Date.now(),
        winner: winnerName,
        duration: duration,
        participantCount: window.RACE_NAMES ? window.RACE_NAMES.length : 0,
      });
      const trimmed = history.slice(0, 10);
      localStorage.setItem('wafflerace_history', JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[Wafflerace] Unable to save local history:', e);
    }
  }

  function showRaceHistory() {
    const section = document.getElementById('history-section');
    const list = document.getElementById('history-list');
    if (!section || !list) return;

    try {
      const history = JSON.parse(
        localStorage.getItem('wafflerace_history') || '[]'
      );
      if (history.length === 0) {
        section.classList.add('hidden');
        return;
      }

      list.innerHTML = '';
      history.forEach((entry) => {
        const div = document.createElement('div');
        div.className =
          'bg-base-200 px-3 py-2 rounded-lg text-sm flex justify-between items-center';
        const date = new Date(entry.timestamp).toLocaleString();

        const summary = document.createElement('div');
        const winner = document.createElement('span');
        winner.className = 'font-medium';
        winner.textContent = entry.winner;

        const meta = document.createElement('span');
        meta.className = 'text-base-content/60 ml-2';
        meta.textContent = `• ${entry.participantCount} participants • ${entry.duration}s`;

        const dateEl = document.createElement('div');
        dateEl.className = 'text-xs text-base-content/60';
        dateEl.textContent = date;

        summary.append(winner, meta);
        div.append(summary, dateEl);
        list.appendChild(div);
      });
      section.classList.remove('hidden');
    } catch (e) {
      section.classList.add('hidden');
    }
  }

  function runAgainWithSameNames() {
    if (!window.RACE_NAMES || window.RACE_NAMES.length === 0) return;

    startTime = null;
    finished = false;
    paused = false;
    results = [];
    particleSystem.clear();

    const resultsEl = document.getElementById('results');
    if (resultsEl) resultsEl.classList.add('hidden');

    const startBtn = document.getElementById('start-btn');
    const peeBtn = document.getElementById('pee-btn');
    const runAgainBtn = document.getElementById('run-again-btn');

    if (startBtn) startBtn.disabled = false;
    if (peeBtn) peeBtn.classList.add('hidden');
    if (runAgainBtn) runAgainBtn.classList.add('hidden');

    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = duration.toFixed(1) + 's';

    // Reset podium classes and details
    const announcement = document.getElementById('winner-announcement');
    const winnerNameEl = document.getElementById('winner-name');
    const p1 = document.getElementById('podium-1st');
    const p2 = document.getElementById('podium-2nd');
    const p3 = document.getElementById('podium-3rd');
    
    if (announcement) {
      announcement.classList.add('opacity-0');
      announcement.classList.remove('opacity-100');
    }
    if (winnerNameEl) {
      winnerNameEl.classList.add('opacity-0', 'scale-95');
      winnerNameEl.classList.remove('opacity-100', 'scale-100');
      winnerNameEl.textContent = '';
    }
    if (p1) {
      p1.classList.add('opacity-0', 'translate-y-8');
      p1.classList.remove('opacity-100', 'translate-y-0', 'scale-105');
    }
    if (p2) {
      p2.classList.add('opacity-0', 'translate-y-4');
      p2.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    }
    if (p3) {
      p3.classList.add('opacity-0', 'translate-y-4');
      p3.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    }

    const winnerCanvas = document.getElementById('winner-boat-canvas');
    if (winnerCanvas) {
      const wCtx = winnerCanvas.getContext('2d');
      wCtx.clearRect(0, 0, winnerCanvas.width, winnerCanvas.height);
    }

    initWaffles();
    draw();
  }

  // Global error handling for better observability
  window.addEventListener('error', (event) => {
    console.error('[Wafflerace] Uncaught error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Wafflerace] Unhandled promise rejection:', event.reason);
  });

  // Init
  function init() {
    try {
      initWaffles();
      draw();
    } catch (err) {
      console.error('[Wafflerace] Failed to initialize race:', err);
    }

    // Bind event controllers
    bindControlButtons({
      onStart: startRace,
      onPee: togglePee,
      onToggleControls: toggleHideControls,
      onRunAgain: runAgainWithSameNames
    });

    // Check spectator mode
    initSpectatorMode(window.IS_SPECTATOR);

    // Setup fullscreen toggles
    initFullscreen(canvas);

    // Auto-start after short delay (nice for OBS / demos)
    setTimeout(() => {
      if (!startTime) {
        // startRace();
      }
    }, 600);
  }

  // Exports for templates and test hooks
  window.copyWinner = copyWinner;
  window.copyFullResults = copyFullResults;
  window.setNameDisplay = setNameDisplay;
  window.RACE_ASSETS = { boatImages, bgImages };
  window.RACE_STATE = {
    get waffles() { return waffles; },
    get parallaxLayers() { return parallaxLayers; }
  };
  window.RACE_DEBUG = {
    teleportToFinish(index) {
      if (waffles[index]) {
        waffles[index].x = FINISH_LINE - 10;
        console.log(`[Wafflerace Debug] Teleported waffle ${index} (${waffles[index].name}) close to finish line.`);
      }
    },
    triggerFinish() {
      if (startTime && !finished) {
        startTime = Date.now() - (duration * 1000) - 100;
        console.log(`[Wafflerace Debug] Triggered immediate race finish.`);
      }
    },
    getFPS() {
      return lastFps;
    }
  };

  init();
})();
