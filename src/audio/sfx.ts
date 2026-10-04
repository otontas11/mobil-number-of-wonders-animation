// Web Audio ile üretilen sesler — ses dosyası yok (doküman §9).
// Do majör, yumuşak tınılar (triangle/sine), ana çıkışta kompresör.
// Bağlam ilk dokunuşta `resume()` ile başlatılır.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let muted = false

const N = {
  C5: 523.25, E5: 659.25, G5: 783.99,
  C6: 1046.5, E6: 1318.5, G6: 1567.98, C7: 2093,
}

function ensure(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.knee.value = 20
  comp.ratio.value = 6
  comp.attack.value = 0.003
  comp.release.value = 0.2
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 1
  master.connect(comp)
  comp.connect(ctx.destination)
  return ctx
}

function ready(): AudioContext | null {
  const c = ensure()
  return c && c.state === 'running' && !muted ? c : null
}

export function resume() {
  const c = ensure()
  if (c && c.state === 'suspended') void c.resume()
}

export function setMuted(v: boolean) {
  muted = v
  if (ctx && master) master.gain.setTargetAtTime(v ? 0 : 1, ctx.currentTime, 0.02)
}

export const isMuted = () => muted

// ---------- temel üreticiler ----------

interface ToneOpts {
  type?: OscillatorType
  at?: number // başlangıç gecikmesi (sn)
  dur?: number
  vol?: number
  attack?: number
  to?: number // bitiş frekansı (glide)
  glideDur?: number
  lowpass?: number
  vibrato?: { rate: number; depth: number }
}

function tone(c: AudioContext, freq: number, o: ToneOpts = {}) {
  const { type = 'triangle', at = 0, dur = 0.25, vol = 0.25, attack = 0.005, to, glideDur, lowpass, vibrato } = o
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + (glideDur ?? dur))
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let out: AudioNode = osc
  if (lowpass) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = lowpass
    osc.connect(f)
    out = f
  }
  if (vibrato) {
    const lfo = c.createOscillator()
    const lg = c.createGain()
    lfo.frequency.value = vibrato.rate
    lg.gain.value = vibrato.depth
    lfo.connect(lg)
    lg.connect(osc.frequency)
    lfo.start(t0)
    lfo.stop(t0 + dur + 0.05)
  }
  out.connect(g)
  g.connect(master!)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

interface NoiseOpts {
  at?: number
  dur?: number
  vol?: number
  type?: BiquadFilterType
  freq?: number
  to?: number
  q?: number
}

function noise(c: AudioContext, o: NoiseOpts = {}) {
  const { at = 0, dur = 0.1, vol = 0.1, type = 'lowpass', freq = 800, to, q = 0.8 } = o
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const t0 = c.currentTime + at
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(freq, t0)
  if (to !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(f)
  f.connect(g)
  g.connect(master!)
  src.start(t0)
  src.stop(t0 + dur + 0.05)
}

// ---------- olay sesleri ----------

/** Sayı seçimi: kısa G5 "tık" */
export function tap() {
  const c = ready()
  if (c) tone(c, N.G5, { type: 'sine', dur: 0.07, vol: 0.16 })
}

/** Doğru cevap: C6 → E6 çan */
export function correct() {
  const c = ready()
  if (!c) return
  tone(c, N.C6, { dur: 0.35, vol: 0.22 })
  tone(c, N.E6, { at: 0.09, dur: 0.45, vol: 0.22 })
}

/** Yanlış cevap: yumuşak, alçalan iki "bup" */
export function wrong() {
  const c = ready()
  if (!c) return
  tone(c, 300, { to: 230, dur: 0.14, vol: 0.2, lowpass: 900 })
  tone(c, 240, { to: 170, at: 0.17, dur: 0.17, vol: 0.2, lowpass: 900 })
}

/** Tahta: vınlama → tok ahşap darbe (150→68 Hz) → küçük sekme → halat gıcırtısı */
export function plank() {
  const c = ready()
  if (!c) return
  noise(c, { type: 'bandpass', freq: 1400, to: 350, dur: 0.2, vol: 0.09, q: 1.2 })
  tone(c, 150, { type: 'sine', to: 68, at: 0.2, dur: 0.14, vol: 0.5, attack: 0.002 })
  noise(c, { at: 0.2, freq: 420, dur: 0.05, vol: 0.18 })
  tone(c, 120, { type: 'sine', to: 80, at: 0.38, dur: 0.07, vol: 0.18, attack: 0.002 })
  tone(c, 430, { type: 'sawtooth', to: 360, at: 0.5, dur: 0.18, vol: 0.04, lowpass: 900, vibrato: { rate: 18, depth: 20 } })
}

/** Köprü tamam: C6-E6-G6-C7 arpej */
export function magic() {
  const c = ready()
  if (!c) return
  ;[N.C6, N.E6, N.G6, N.C7].forEach((f, i) => tone(c, f, { type: 'sine', at: i * 0.1, dur: 0.5, vol: 0.16 }))
}

/** Kilit kırılır: metalik şıngırtı + parıltı + yere düşme */
export function lockBreak() {
  const c = ready()
  if (!c) return
  tone(c, 1870, { type: 'sine', dur: 0.4, vol: 0.14, attack: 0.001 })
  tone(c, 2730, { type: 'sine', dur: 0.32, vol: 0.09, attack: 0.001 })
  tone(c, 3910, { type: 'sine', dur: 0.26, vol: 0.06, attack: 0.001 })
  for (let i = 0; i < 4; i++) tone(c, 3000 + Math.random() * 2000, { type: 'sine', at: 0.05 + i * 0.06, dur: 0.12, vol: 0.04 })
  tone(c, 110, { type: 'sine', to: 70, at: 0.7, dur: 0.1, vol: 0.22, attack: 0.002 })
}

/** Kapı açılır: titreşimli metal gıcırtı (190→285→160 Hz, 1,1 sn) + yumuşak çarpma */
export function doorCreak() {
  const c = ready()
  if (!c) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(190, t0)
  osc.frequency.linearRampToValueAtTime(285, t0 + 0.5)
  osc.frequency.linearRampToValueAtTime(160, t0 + 1.1)
  const lfo = c.createOscillator()
  const lg = c.createGain()
  lfo.frequency.value = 7
  lg.gain.value = 12
  lfo.connect(lg)
  lg.connect(osc.frequency)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 1200
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.08)
  g.gain.setValueAtTime(0.07, t0 + 0.9)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1)
  osc.connect(f)
  f.connect(g)
  g.connect(master!)
  osc.start(t0)
  lfo.start(t0)
  osc.stop(t0 + 1.15)
  lfo.stop(t0 + 1.15)
  tone(c, 90, { type: 'sine', to: 60, at: 1.1, dur: 0.09, vol: 0.18, attack: 0.002 })
}

/** Köpek: iki kısa "hav" */
export function bark() {
  const c = ready()
  if (!c) return
  for (const at of [0, 0.18]) {
    tone(c, 420, { type: 'sawtooth', to: 260, at, dur: 0.11, vol: 0.2, lowpass: 1600, attack: 0.004 })
    noise(c, { at, freq: 1800, to: 500, dur: 0.08, vol: 0.05, type: 'bandpass', q: 0.7 })
  }
}

/** Yürüyüş: ahşapta tıpırtı */
export function step() {
  const c = ready()
  if (!c) return
  noise(c, { freq: 900, dur: 0.04, vol: 0.1 })
  tone(c, 180, { type: 'sine', to: 110, dur: 0.05, vol: 0.12, attack: 0.002 })
}

/** Sarılma: C5-E5-G5-C6 arpej + akor + parıltı */
export function fanfare() {
  const c = ready()
  if (!c) return
  const chord = [N.C5, N.E5, N.G5, N.C6]
  chord.forEach((f, i) => tone(c, f, { at: i * 0.12, dur: 0.4, vol: 0.18 }))
  chord.forEach((f) => tone(c, f, { at: 0.5, dur: 0.9, vol: 0.1 }))
  for (let i = 0; i < 5; i++) tone(c, 1500 + Math.random() * 1500, { type: 'sine', at: 0.6 + i * 0.12, dur: 0.25, vol: 0.05 })
}
