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
    // Only use images that actually loaded successfully for this collection
    const validBgs = bgImages.filter((img) => img.complete && img.width > 0);
    if (validBgs.length < 3) {
      // Fallback: duplicate what we have or use solid color later in draw()
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

    // Winner (fastest) should cross the finish line right at the end of the timer
    const winnerSpeed = distance / duration;

    // Everyone else is slower than the winner (creates uncertainty who will win)
    const minMultiplier = 0.7;
    const maxMultiplier = 0.97;

    // Dynamic vertical spacing so many racers still fit nicely (with some overlap allowed)
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

  function drawBoat(ctx, x, y, bob, name, spriteIndex, tilt) {
    const img = boatImages[spriteIndex];
    if (!img || !img.complete) {
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.fillStyle = '#f4c95f';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate((tilt || 0) * 0.035); // subtle rocking

    const targetHeight = 72;
    const scale = targetHeight / img.height;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Reactive flag - flutters more with tilt/speed
    const flagColor = '#c48a3a';
    const outlineColor = '#8b5a2b';
    const attachX = -drawWidth / 2 + 6;
    const attachY = -8 + (tilt || 0) * 0.4;

    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(attachX, attachY - 4);
    ctx.quadraticCurveTo(
      attachX - 14 - (tilt || 0) * 0.3,
      attachY - 8,
      attachX - 34,
      attachY - 1
    );
    ctx.quadraticCurveTo(attachX - 33, attachY + 4, attachX - 34, attachY + 7);
    ctx.quadraticCurveTo(
      attachX - 14 - (tilt || 0) * 0.3,
      attachY + 6,
      attachX,
      attachY + 5
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(attachX, attachY - 4);
    ctx.quadraticCurveTo(
      attachX - 14 - (tilt || 0) * 0.3,
      attachY - 8,
      attachX - 34,
      attachY - 1
    );
    ctx.quadraticCurveTo(attachX - 33, attachY + 4, attachX - 34, attachY + 7);
    ctx.quadraticCurveTo(
      attachX - 14 - (tilt || 0) * 0.3,
      attachY + 6,
      attachX,
      attachY + 5
    );
    ctx.stroke();

    if (nameDisplayMode !== 'hidden') {
      ctx.fillStyle = '#3f2a1d';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'right';
      let displayName = name;
      if (nameDisplayMode === 'short' && name.length > 9) {
        displayName = name.slice(0, 8) + '…';
      }
      ctx.fillText(displayName, attachX - 2, attachY + 2);
    }

    ctx.restore();
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
      ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f4e9d8';
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Loading premium boats & river...',
        canvas.width / 2,
        canvas.height / 2 - 8
      );
      const barW = 260;
      const barX = (canvas.width - barW) / 2;
      ctx.fillStyle = '#3f2a1d';
      ctx.fillRect(barX, canvas.height / 2 + 12, barW, 4);
      ctx.fillStyle = '#c48a3a';
      ctx.fillRect(barX, canvas.height / 2 + 12, barW * loadProgress, 4);
      return;
    }

    // === Parallax Background Layers (far → near) ===
    if (startTime && parallaxLayers.length === 3) {
      parallaxLayers.forEach((layer) => {
        if (!layer.img || !layer.img.complete) return;
        const speed = layer.speed;
        const offset =
          (((Date.now() - startTime) / 1000) * speed) % layer.img.width;
        ctx.drawImage(layer.img, -offset, 0, layer.img.width, canvas.height);
        ctx.drawImage(
          layer.img,
          -offset + layer.img.width,
          0,
          layer.img.width,
          canvas.height
        );
      });
    } else {
      ctx.fillStyle = '#a8c8dc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Particles (syrup drips / splashes)
    particleSystem.update();
    particleSystem.draw(ctx);

    // Finish line (late reveal)
    const finishVisibility = Math.max(0, (progress - 0.72) / 0.28);
    if (finishVisibility > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, finishVisibility);
      ctx.strokeStyle = '#3f2a1d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(FINISH_LINE, 30);
      ctx.lineTo(FINISH_LINE, canvas.height - 30);
      ctx.stroke();
      ctx.fillStyle = '#3f2a1d';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', FINISH_LINE, 22);
      ctx.restore();
    }

    // Boats
    waffles.forEach((w) => {
      const bob = Math.sin(w.phase) * 2.5;

      const logicalProgress = (w.x - START_X) / (FINISH_LINE - START_X);
      const visProg = calculateVisualProgress(logicalProgress, progress);

      const visualX =
        START_X + (FINISH_LINE - START_X) * Math.max(0, Math.min(1, visProg));
      drawBoat(ctx, visualX, w.y, bob, w.name, w.spriteIndex, w.tilt);
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
    if (!startTime || finished || paused) return;

    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Calculate delta time in seconds for frame-rate independent movement
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
        .map((w) => ({ name: w.name }));

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
    document.getElementById('start-btn').disabled = true;

    const top3 = results.slice(0, 3);
    const winner = top3[0];

    // === Dramatic Winner Reveal ===
    if (winner) {
      // Show announcement with delay
      setTimeout(() => {
        announcement.classList.remove('opacity-0');
        announcement.classList.add('opacity-100');

        // Then reveal the winner name with bigger pop
        setTimeout(() => {
          winnerNameEl.textContent = winner.name;
          winnerNameEl.classList.remove('opacity-0', 'scale-95');
          winnerNameEl.classList.add('opacity-100', 'scale-100');

          // Trigger confetti / particles for winner
          const rect = canvas.getBoundingClientRect();
          particleSystem.emitWinnerConfetti(rect.width / 2, rect.height / 2);
        }, 650);
      }, 300);
    }

    // === Podium + Full Field (with slight delay for drama) ===
    setTimeout(() => {
      // Top 3 Podium
      if (top3.length > 0) {
        const podiumHeader = document.createElement('div');
        podiumHeader.className = 'text-center mb-4';
        podiumHeader.innerHTML = `<h3 class="text-xl font-semibold tracking-wide">PODIUM</h3>`;
        list.appendChild(podiumHeader);

        const podiumList = document.createElement('div');
        podiumList.className = 'space-y-3 mb-8';

        top3.forEach((r, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          const isWinner = index === 0;

          const div = document.createElement('div');
          div.className = `flex items-center justify-between p-4 rounded-2xl text-lg font-medium transition-all ${
            isWinner
              ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg scale-[1.03]'
              : 'bg-base-200 border border-base-300'
          }`;

          const details = document.createElement('div');
          details.className = 'flex items-center gap-4';

          const medalEl = document.createElement('span');
          medalEl.className = 'text-4xl';
          medalEl.textContent = medal;

          const nameEl = document.createElement('span');
          nameEl.className = 'font-semibold';
          nameEl.textContent = r.name;

          details.append(medalEl, nameEl);
          div.appendChild(details);

          if (isWinner) {
            const winnerBadge = document.createElement('span');
            winnerBadge.className = 'text-sm font-bold text-yellow-600';
            winnerBadge.textContent = 'WINNER';
            div.appendChild(winnerBadge);
          }

          podiumList.appendChild(div);
        });

        list.appendChild(podiumList);
      }

      // Full Field
      if (results.length > 3) {
        const restHeader = document.createElement('h4');
        restHeader.className =
          'text-sm font-semibold text-base-content/70 mb-3 px-1 tracking-wider';
        restHeader.textContent = 'FULL FIELD';
        list.appendChild(restHeader);

        const restContainer = document.createElement('div');
        restContainer.className = 'space-y-1.5 max-h-[280px] overflow-auto pr-1';

        results.forEach((r, index) => {
          const div = document.createElement('div');
          div.className =
            'flex items-center gap-3 bg-base-200 px-4 py-2.5 rounded-xl text-sm';

          const rank = document.createElement('div');
          rank.className = 'badge badge-ghost badge-sm w-7 justify-center font-mono';
          rank.textContent = String(index + 1);

          const name = document.createElement('span');
          name.className = 'font-medium';
          name.textContent = r.name;

          div.append(rank, name);
          restContainer.appendChild(div);
        });

        list.appendChild(restContainer);
      }

      // Save to history + show history + Run Again button
      if (results.length > 0) {
        saveRaceToHistory(results[0].name);
      }
      showRaceHistory();

      const runAgainBtn = document.getElementById('run-again-btn');
      if (runAgainBtn) runAgainBtn.classList.remove('hidden');

      // Play win chime
      setTimeout(playFinishChime, 200);
    }, 1400);
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

    document.getElementById('start-btn').disabled = true;
    const peeBtn = document.getElementById('pee-btn');
    if (peeBtn) peeBtn.classList.remove('hidden');

    loop();
  }

  function togglePee() {
    const peeBtn = document.getElementById('pee-btn');
    if (!peeBtn) return;

    paused = !paused;

    if (paused) {
      pauseStartTime = Date.now();
      peeBtn.textContent = 'Resume Race';
      peeBtn.classList.remove('btn-warning');
      peeBtn.classList.add('btn-success');
    } else {
      // Adjust startTime to account for pause duration
      if (pauseStartTime) {
        const pauseDuration = Date.now() - pauseStartTime;
        startTime += pauseDuration;
        pauseStartTime = null;
      }
      peeBtn.textContent = 'I need to pee';
      peeBtn.classList.remove('btn-success');
      peeBtn.classList.add('btn-warning');
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
    const controls = document.getElementById('race-controls');
    const nameOptions = document.getElementById('name-options');
    const hideBtn = document.getElementById('hide-controls-btn');

    controlsHidden = !controlsHidden;

    if (controlsHidden) {
      if (controls) controls.style.display = 'none';
      if (nameOptions) nameOptions.style.display = 'none';
      if (hideBtn) hideBtn.textContent = 'Show Controls';
    } else {
      if (controls) controls.style.display = '';
      if (nameOptions) nameOptions.style.display = '';
      if (hideBtn) hideBtn.textContent = 'Hide Controls';
    }
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

  window.copyWinner = copyWinner;
  window.copyFullResults = copyFullResults;
  window.setNameDisplay = setNameDisplay;
  window.RACE_ASSETS = { boatImages, bgImages };
  window.RACE_STATE = {
    get waffles() { return waffles; },
    get parallaxLayers() { return parallaxLayers; }
  };

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

    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', startRace);

    const peeBtn = document.getElementById('pee-btn');
    if (peeBtn) {
      peeBtn.addEventListener('click', togglePee);
    }

    const hideBtn = document.getElementById('hide-controls-btn');
    if (hideBtn) {
      hideBtn.addEventListener('click', toggleHideControls);
    }

    const runAgainBtn = document.getElementById('run-again-btn');
    if (runAgainBtn) {
      runAgainBtn.addEventListener('click', runAgainWithSameNames);
    }

    // Spectator mode - hide controls and start button
    if (window.IS_SPECTATOR) {
      const startBtn = document.getElementById('start-btn');
      const peeBtn = document.getElementById('pee-btn');
      const controls = document.getElementById('race-controls');
      const nameOptions = document.getElementById('name-options');

      if (startBtn) startBtn.style.display = 'none';
      if (peeBtn) peeBtn.style.display = 'none';
      if (controls) controls.style.display = 'none';
      if (nameOptions) nameOptions.style.display = 'none';
    }

    // Fullscreen button
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const container = canvas.parentElement; // the card-body
        if (!document.fullscreenElement) {
          container.requestFullscreen?.() ||
            container.webkitRequestFullscreen?.() ||
            container.msRequestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
    }

    // Auto-start after short delay (nice for OBS / demos)
    setTimeout(() => {
      if (!startTime) {
        // Uncomment the next line if you want auto-start
        // startRace();
      }
    }, 600);
  }

  init();
})();
