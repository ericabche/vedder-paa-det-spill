// lyd.js – lydeffekter og vibrasjon. Alle lydene lages i koden med Web Audio API,
// så det trengs ingen lydfiler.

const LAGRINGSNOKKEL = 'vedder-lyd';

let ctx = null;  // AudioContext, opprettes ved første klikk (nettlesere krever det)
let paa = lesInnstilling();

function lesInnstilling() {
  try {
    return localStorage.getItem(LAGRINGSNOKKEL) !== 'av';
  } catch {
    return true; // privat modus o.l.: lyd på som standard
  }
}

/** Må kalles fra et klikk/trykk før lyd kan spilles. Trygt å kalle flere ganger. */
export function aktiver() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return; // svært gamle nettlesere
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function erPaa() {
  return paa;
}

export function settPaa(verdi) {
  paa = verdi;
  try {
    localStorage.setItem(LAGRINGSNOKKEL, verdi ? 'paa' : 'av');
  } catch {
    // ignorer – innstillingen gjelder bare denne økten
  }
}

// ---------- Byggekloss: én tone ----------

/**
 * Spiller én tone.
 * @param {number} frekvens  Hz
 * @param {number} start     sekunder fra nå
 * @param {number} lengde    sekunder
 * @param {object} valg      type (bølgeform), volum, glid (Hz å gli mot)
 */
function tone(frekvens, start, lengde, { type = 'sine', volum = 0.2, glid = null } = {}) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frekvens, t0);
  if (glid) osc.frequency.exponentialRampToValueAtTime(glid, t0 + lengde);

  // Kort inn- og uttoning hindrer klikkelyder
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volum, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + lengde);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + lengde + 0.05);
}

function kanSpille() {
  return paa && ctx && ctx.state === 'running';
}

// ---------- Lydeffekter ----------

/** Nedtelling: lyst pip på 3 og 2, høyere og lengre på 1. */
export function nedtelling(sekunder) {
  if (!kanSpille()) return;
  if (sekunder === 1) tone(1320, 0, 0.25, { type: 'square', volum: 0.12 });
  else tone(880, 0, 0.12, { type: 'square', volum: 0.1 });
}

/** Kort «blipp» når noen trykker +1 Riktig. */
export function riktig() {
  if (!kanSpille()) return;
  tone(660, 0, 0.08, { type: 'triangle', volum: 0.2, glid: 990 });
}

/** Timeren starter. */
export function start() {
  if (!kanSpille()) return;
  tone(440, 0, 0.1, { type: 'triangle', volum: 0.2 });
  tone(660, 0.1, 0.15, { type: 'triangle', volum: 0.2 });
}

/** Klarte det: stigende treklang. */
export function seier() {
  if (!kanSpille()) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, { type: 'triangle', volum: 0.18 }));
}

/** Tiden er ute: lav, skurrende buzzer. */
export function buzzer() {
  if (!kanSpille()) return;
  tone(160, 0, 0.6, { type: 'sawtooth', volum: 0.15, glid: 90 });
  tone(165, 0, 0.6, { type: 'square', volum: 0.08, glid: 95 });
}

/** Noen har vunnet spillet: liten fanfare. */
export function fanfare() {
  if (!kanSpille()) return;
  const noter = [
    [523, 0, 0.15], [523, 0.15, 0.15], [523, 0.3, 0.15],
    [659, 0.45, 0.4], [587, 0.85, 0.15], [659, 1.0, 0.15], [784, 1.15, 0.6],
  ];
  noter.forEach(([f, s, l]) => tone(f, s, l, { type: 'triangle', volum: 0.18 }));
}

// ---------- Vibrasjon ----------

const VIBRASJON = {
  riktig: 30,
  nedtelling: 60,
  buzzer: [300, 100, 300],
  seier: [80, 60, 80, 60, 160],
};

/** Vibrerer telefonen. Gjør ingenting på enheter uten støtte (bl.a. iPhone). */
export function vibrer(type) {
  if (!paa || !('vibrate' in navigator)) return;
  navigator.vibrate(VIBRASJON[type] ?? 50);
}