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
  if (now - lastSplashTime < 0.28) return; // throttle to prevent annoying repetitive buzz
  lastSplashTime = now;

  try {
    // 1. Soft bubble component (sine sweep)
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    const startFreq = 130 + Math.random() * 40;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.01 * intensity, now);
    oscGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    // 2. High-frequency splash component (noise sweep)
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(
      1,
      audioCtx.sampleRate * 0.18, // shorter duration
      audioCtx.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0; // tighter resonance for water color
    const startFilterFreq = 650 + Math.random() * 180;
    filter.frequency.setValueAtTime(startFilterFreq, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.006 * intensity, now);
    noiseGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.18);
    noise.stop(now + 0.18);
  } catch (e) {
    // Ignore audio context issues
  }
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
