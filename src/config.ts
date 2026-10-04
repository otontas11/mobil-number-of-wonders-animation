// Oyun ayarları (doküman §11.3)
export const CFG = {
  planks: 8, // köprü tahtası = köprü sorusu sayısı
  numberRange: [2, 12] as [number, number],
  ringSize: 6,
  steps: 2,
  operation: '+' as const,
  nextQuestionDelayMs: 900,
  wrongResetDelayMs: 750,
  walkSpeed: 3.0,
}

export const TOTAL_QUESTIONS = CFG.planks + 1

export const EMBED = new URLSearchParams(location.search).has('embed')

export const REDUCE_MOTION =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
