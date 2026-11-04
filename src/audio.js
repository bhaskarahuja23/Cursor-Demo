let ctx = null;

function ac() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const audio = {
  unlock() {
    ac();
  },
  jump() {
    tone(520, 0.07, "square", 0.05);
    tone(760, 0.09, "square", 0.04, 0.04);
  },
  coin() {
    tone(988, 0.06, "square", 0.05);
    tone(1319, 0.12, "square", 0.045, 0.06);
  },
  cabbage() {
    tone(392, 0.08, "triangle", 0.06);
    tone(523, 0.1, "triangle", 0.05, 0.07);
    tone(784, 0.14, "square", 0.04, 0.14);
  },
  stomp() {
    tone(196, 0.07, "square", 0.06);
    tone(98, 0.1, "triangle", 0.05, 0.04);
  },
  bump() {
    tone(140, 0.06, "square", 0.04);
  },
  hurt() {
    tone(440, 0.09, "square", 0.06);
    tone(311, 0.1, "square", 0.05, 0.09);
    tone(180, 0.18, "sawtooth", 0.04, 0.18);
  },
  clear() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone(freq, 0.14, "square", 0.05, i * 0.11);
    });
  },
  start() {
    tone(392, 0.08, "square", 0.05);
    tone(523, 0.12, "square", 0.05, 0.08);
  },
};
