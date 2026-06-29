export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AnyAudioContext = (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;
  if (!AnyAudioContext) return null;
  return new AnyAudioContext();
}

export async function playSuccessSound(ctx: AudioContext) {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const now = ctx.currentTime;

  // Root note C5
  const rootFreq = 523.25;
  // Pleasant major triad arpeggio: C5 - E5 - G5 - C6
  const frequencies = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 2];

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = now + index * 0.06;
    const duration = 0.35;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}

export async function playWrongSound(ctx: AudioContext) {
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}
