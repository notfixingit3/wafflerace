// Wafflerace - Canvas Animation
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
  const BG_COUNT = 20;

  // Visual clamping constants (core suspense mechanic)
  const VISUAL_CLAMP_START = 0.68;
  const VISUAL_CLAMP_RELEASE = 0.92;
  const VISUAL_MAX_DURING_CLAMP = 0.81;

  // Jitter behavior
  const BASE_JITTER_INTERVAL = 90;
  const FINAL_PHASE_JITTER_MULTIPLIER = 0.6; // more frequent in final phase

  // === AI-Generated Boat Sprites (50 right-facing variants) ===
  const boatImages = [];
  let spritesLoaded = 0;

  function preloadBoatSprites() {
    for (let i = 1; i <= TOTAL_BOAT_SPRITES; i++) {
      const img = new Image();
      img.src = `/assets/boat-concepts/boat-right-${String(i).padStart(2, '0')}.jpg`;
      img.onload = () => {
        spritesLoaded++;
      };
      boatImages.push(img);
    }
  }
  preloadBoatSprites();

  // === Background images for parallax layers ===
  const BG_COUNT = 20;
  const bgImages = [];
  function preloadBackgrounds() {
    for (let i = 1; i <= BG_COUNT; i++) {
      const img = new Image();
      img.src = `/assets/backgrounds/bg-river-${String(i).padStart(2, '0')}.jpg`;
      bgImages.push(img);
    }
  }
  preloadBackgrounds();

  // Runtime selected parallax layers (far, mid, near/water)
  let parallaxLayers = [];

  // Simple particle system for syrup drips / splashes
  let particles = [];

  function emitParticles(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + Math.random() * 6,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0.6 + Math.random() * 1.2,
        life: 28 + Math.random() * 18,
        size: 1.2 + Math.random() * 1.8,
      });
    }
  }

  // Audio (Web Audio API - synthesized for zero extra assets)
  let audioCtx;
  let waterOsc, waterGain, waterFilter;
  let lastSplashTime = 0;

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Subtle water lapping drone
      waterOsc = audioCtx.createOscillator();
      waterOsc.type = 'sine';
      waterOsc.frequency.value = 48;

      waterFilter = audioCtx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 420;

      waterGain = audioCtx.createGain();
      waterGain.gain.value = 0.018;

      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * 2,
        audioCtx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 280;
      noiseFilter.Q.value = 1.8;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.value = 0.012;

      const waterMix = audioCtx.createGain();
      waterMix.gain.value = 0.7;

      waterOsc.connect(waterFilter);
      waterFilter.connect(waterGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      waterGain.connect(waterMix);
      noiseGain.connect(waterMix);
      waterMix.connect(audioCtx.destination);

      waterOsc.start();
      noise.start();
    } catch (e) {
      // Audio not critical
    }
  }

  function playSplash(intensity = 1) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastSplashTime < 0.06) return; // throttle
    lastSplashTime = now;

    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 180 + Math.random() * 90;

    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(
      1,
      audioCtx.sampleRate * 0.6,
      audioCtx.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650 + intensity * 180;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.035 * intensity;

    const decay = audioCtx.createGain();
    decay.gain.value = 1;
    decay.gain.linearRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(decay);
    decay.connect(audioCtx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.6);
  }

  function playFinishChime() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [620, 780, 930];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.09;
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.9 + i * 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + 1.4);
    });
  }

  const FINISH_LINE = canvas.width - 80;
  const START_X = 90;

  function initWaffles() {
    waffles = [];
    results = [];
    finished = false;
    particles = [];

    // Randomly pick 3 distinct backgrounds for parallax (far / mid / water)
    const shuffled = [...Array(BG_COUNT).keys()].sort(
      () => Math.random() - 0.5
    );
    parallaxLayers = [
      { img: bgImages[shuffled[0]], speed: 7 }, // far - very slow
      { img: bgImages[shuffled[1]], speed: 18 }, // mid
      { img: bgImages[shuffled[2]], speed: 31 }, // near water - faster
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
    const availableHeight = canvas.height - paddingTop - paddingBottom;
    const verticalSpacing = Math.max(
      23,
      Math.min(36, availableHeight / Math.max(1, names.length - 1))
    );

    names.forEach((name, i) => {
      const multiplier =
        minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
      const base = winnerSpeed * multiplier;

      waffles.push({
        name: name,
        x: START_X,
        y: paddingTop + i * verticalSpacing,
        baseSpeed: base,
        currentSpeed: base,
        targetSpeed: base,
        phase: Math.random() * Math.PI * 2,
        bobSpeed: 2.6 + Math.random() * 1.6,
        lastJitter: 0,
        finished: false,
        finishTime: 0,
        spriteIndex: Math.floor(Math.random() * TOTAL_BOAT_SPRITES),
        tilt: 0,
      });
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

    const totalAssets = TOTAL_BOAT_SPRITES + BG_COUNT;
    const loaded = spritesLoaded + bgImages.filter((b) => b.complete).length;
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
      parallaxLayers.forEach((layer, idx) => {
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
    ctx.fillStyle = 'rgba(140, 80, 45, 0.75)';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.life--;
      p.size *= 0.985;
      if (p.life <= 0) particles.splice(i, 1);
    }

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
      let visProg = logicalProgress;

      if (progress > VISUAL_CLAMP_START) {
        if (progress < VISUAL_CLAMP_RELEASE) {
          visProg = Math.min(logicalProgress, VISUAL_MAX_DURING_CLAMP);
        } else {
          const releaseT =
            (progress - VISUAL_CLAMP_RELEASE) / (1 - VISUAL_CLAMP_RELEASE);
          const maxVis = VISUAL_MAX_DURING_CLAMP + releaseT * 0.19;
          visProg = Math.min(logicalProgress, maxVis);
        }
      }

      const visualX =
        START_X + (FINISH_LINE - START_X) * Math.max(0, Math.min(1, visProg));
      drawBoat(ctx, visualX, w.y, bob, w.name, w.spriteIndex, w.tilt);
    });
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

    let allFinished = true;

    waffles.forEach((w) => {
      if (w.finished) return;

      allFinished = false;

      // === Very strong, noticeable jitter for chaotic racing ===
      const isFinalPhase = progress > 0.82;
      const jitterInterval = isFinalPhase
        ? BASE_JITTER_INTERVAL * FINAL_PHASE_JITTER_MULTIPLIER +
          Math.random() * 55
        : BASE_JITTER_INTERVAL + Math.random() * 100;

      if (now - w.lastJitter > jitterInterval) {
        const myProgress = (w.x - START_X) / (FINISH_LINE - START_X);
        const avgProgress =
          waffles.reduce((sum, ww) => sum + (ww.x - START_X), 0) /
          waffles.length /
          (FINISH_LINE - START_X);
        const behindFactor = Math.max(0, avgProgress - myProgress + 0.18);

        let mult = 0.32 + Math.random() * 1.8;

        if (behindFactor > 0.05 && Math.random() < 0.68) {
          mult = 2.3 + Math.random() * 2.6;
        }

        if (Math.random() < 0.29) {
          mult = 3.0 + Math.random() * 2.4;
        }

        if (Math.random() < 0.17) {
          mult = 0.18 + Math.random() * 0.42;
        }

        // Final phase: much wilder swings
        if (isFinalPhase) {
          mult *= 1.35;
          if (Math.random() < 0.45) mult = 3.8 + Math.random() * 3.2;
        }

        w.targetSpeed = w.baseSpeed * mult;
        w.targetSpeed = Math.max(
          w.baseSpeed * 0.12,
          Math.min(w.baseSpeed * 6.2, w.targetSpeed)
        );
        w.lastJitter = now;

        // Emit particles on big changes
        if (Math.abs(w.targetSpeed - w.currentSpeed) > w.baseSpeed * 1.4) {
          emitParticles(w.x, w.y + 6, isFinalPhase ? 9 : 5);
          if (audioCtx && isFinalPhase) playSplash(1.1);
        }
      }

      // Extremely fast response — changes should feel sudden and very obvious
      const speedLerp = 0.22;
      w.currentSpeed += (w.targetSpeed - w.currentSpeed) * speedLerp;

      // High continuous noise
      w.currentSpeed += (Math.random() - 0.5) * 0.032;

      // Mild acceleration only very late
      const accel = 1 + progress * 0.15;
      const move = w.currentSpeed * accel * dt;

      w.phase += w.bobSpeed * 0.016;
      w.tilt =
        Math.sin(w.phase * 0.9) * 3.5 + (w.currentSpeed - w.baseSpeed) * 0.018;

      w.x += move;
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
    const list = document.getElementById('results-list');
    list.innerHTML = '';

    // === Podium (Top 3) ===
    const top3 = results.slice(0, 3);

    if (top3.length > 0) {
      const podiumHeader = document.createElement('div');
      podiumHeader.className = 'text-center mb-3';
      podiumHeader.innerHTML = `<h3 class="text-2xl font-bold">🏆 Winner</h3>`;
      list.appendChild(podiumHeader);

      const podiumList = document.createElement('div');
      podiumList.className = 'space-y-2 mb-6';

      top3.forEach((r, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        const isWinner = index === 0;

        const div = document.createElement('div');
        div.className = `flex items-center justify-between p-4 rounded-xl text-lg font-medium ${
          isWinner
            ? 'bg-yellow-100 border-2 border-yellow-400 scale-[1.02]'
            : 'bg-base-200'
        }`;

        div.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-3xl">${medal}</span>
            <span>${r.name}</span>
          </div>
        `;
        podiumList.appendChild(div);
      });

      list.appendChild(podiumList);
    }

    // Full field (everyone, no times)
    if (results.length > 3) {
      const restHeader = document.createElement('h4');
      restHeader.className =
        'text-sm font-semibold text-base-content/70 mb-2 px-1';
      restHeader.textContent = 'Full Field';
      list.appendChild(restHeader);

      const restContainer = document.createElement('div');
      restContainer.className = 'space-y-1.5';

      results.forEach((r, index) => {
        const div = document.createElement('div');
        div.className =
          'flex items-center gap-3 bg-base-200 px-3 py-2 rounded-lg text-sm';
        div.innerHTML = `
          <div class="badge badge-ghost badge-sm w-6 justify-center">${index + 1}</div>
          <span>${r.name}</span>
        `;
        restContainer.appendChild(div);
      });

      list.appendChild(restContainer);
    }

    container.classList.remove('hidden');
    document.getElementById('start-btn').disabled = true;

    // Save to history
    if (results.length > 0) {
      saveRaceToHistory(results[0].name);
    }

    // Show history
    showRaceHistory();

    // Show "Run Again" button
    const runAgainBtn = document.getElementById('run-again-btn');
    if (runAgainBtn) runAgainBtn.classList.remove('hidden');

    // Subtle win chime
    setTimeout(playFinishChime, 120);
  }

  let timerInterval = null;

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
    } catch (e) {}
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
        div.innerHTML = `
          <div>
            <span class="font-medium">${entry.winner}</span>
            <span class="text-base-content/60 ml-2">• ${entry.participantCount} participants • ${entry.duration}s</span>
          </div>
          <div class="text-xs text-base-content/60">${date}</div>
        `;
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
    particles = [];

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
