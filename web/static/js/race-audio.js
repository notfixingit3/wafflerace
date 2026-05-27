let audioCtx;
let waterOsc, waterGain, waterFilter;
let lastSplashTime = 0;

export function initAudio() {
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

export function playSplash(intensity = 1) {
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

export function playFinishChime() {
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
