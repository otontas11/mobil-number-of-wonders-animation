import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { CFG, EMBED, TOTAL_QUESTIONS } from '@/config'
import * as sfx from '@/audio/sfx'
import { sendToNative, type ReplayEvent, type ReplayOptions } from '@/native/bridge'
import { bubbleFor, HINT_BUBBLE, HUG_BUBBLE, questionLabelFor, signFor, WRONG_BUBBLE } from './messages'
import { isCorrectPair, newQuestion, type Question } from './questions'
import { TL } from './timeline'
import type { SceneHandle } from './types'

export type Status = 'playing' | 'rescued'
type Resolution = 'none' | 'correct' | 'wrong'

// Oyun durumu (doküman §5). Sahne (three.js) bu store'u her karede okur;
// animasyon sayaçları (cheerT, sadT, rescueT) ise sahnede tutulur.
export const useGameStore = defineStore('game', () => {
  const solved = ref(0)
  const placed = ref(0)
  const status = ref<Status>('playing')

  const question = shallowRef<Question | null>(null)
  const picked = ref<number[]>([])
  const resolution = ref<Resolution>('none')

  const bubble = ref(bubbleFor(0))
  const sign = ref(signFor(0))
  const signPulse = ref(0) // artınca tabela "pop" animasyonu tekrar oynar
  const ringShake = ref(0) // artınca halka sallanır
  const finaleVisible = ref(false)
  const muted = ref(sfx.isMuted())

  const isKeyQuestion = computed(() => solved.value === CFG.planks)
  const questionLabel = computed(() => questionLabelFor(solved.value))
  const unlocked = computed(() => solved.value >= TOTAL_QUESTIONS)
  const inputLocked = computed(() => status.value !== 'playing' || resolution.value === 'correct')

  const equation = computed(() => {
    const q = question.value
    if (!q) return ''
    const [a, b] = picked.value
    if (a === undefined) return `? + ? = ${q.target}`
    if (b === undefined) return `${q.nums[a]} + ? = ${q.target}`
    const sum = q.nums[a]! + q.nums[b]!
    return `${q.nums[a]} + ${q.nums[b]} = ${resolution.value === 'wrong' ? sum : q.target}`
  })

  let scene: SceneHandle | null = null
  let bubbleTimer = 0
  let nextTimer = 0
  let wrongTimer = 0
  let replayTimer = 0

  function attachScene(s: SceneHandle | null) {
    scene = s
  }

  function setSign(text: string) {
    sign.value = text
    signPulse.value++
  }

  function clearTimers() {
    clearTimeout(bubbleTimer)
    clearTimeout(nextTimer)
    clearTimeout(wrongTimer)
    clearTimeout(replayTimer)
  }

  function nextQuestion() {
    question.value = newQuestion()
    picked.value = []
    resolution.value = 'none'
  }

  function start() {
    clearTimers()
    solved.value = 0
    placed.value = 0
    status.value = 'playing'
    finaleVisible.value = false
    setSign(signFor(0))
    bubble.value = bubbleFor(0)
    scene?.reset()
    if (!EMBED) nextQuestion()
    sendToNative('start')
  }

  // Doküman §5.3
  function onCorrect() {
    if (status.value !== 'playing') return
    solved.value++
    scene?.cheer()
    sfx.correct()
    if (solved.value <= CFG.planks) {
      scene?.addPlank(placed.value)
      placed.value++
      sfx.plank()
    }
    bubble.value = bubbleFor(solved.value)
    if (solved.value === CFG.planks || solved.value === TOTAL_QUESTIONS) setSign(signFor(solved.value))
    if (solved.value === CFG.planks) setTimeout(sfx.magic, TL.MAGIC_DELAY_MS)
    sendToNative('progress', { solved: solved.value, planks: placed.value, total: TOTAL_QUESTIONS })
    if (solved.value >= TOTAL_QUESTIONS) {
      status.value = 'rescued'
      scene?.startRescue()
      sendToNative('rescued')
    } else if (!EMBED) {
      nextTimer = window.setTimeout(nextQuestion, CFG.nextQuestionDelayMs)
    }
  }

  function onWrong() {
    if (status.value !== 'playing') return
    scene?.sad()
    sfx.wrong()
    bubble.value = WRONG_BUBBLE
    clearTimeout(bubbleTimer)
    bubbleTimer = window.setTimeout(() => {
      if (status.value === 'playing') bubble.value = bubbleFor(solved.value)
    }, 1500)
  }

  // Native tarafta ipucu alındı: kaşif köprüyü işaret eder (doküman §12.2).
  function onHint() {
    if (status.value !== 'playing') return
    scene?.hint()
    sfx.tap()
    bubble.value = HINT_BUBBLE
    clearTimeout(bubbleTimer)
    bubbleTimer = window.setTimeout(() => {
      if (status.value === 'playing') bubble.value = bubbleFor(solved.value)
    }, TL.HINT_BUBBLE_MS)
  }

  /**
   * Native'in biriktirdiği döngüyü sahnede oynatır: sıfırla, sonra olayları
   * sırayla uygula. Ödül ekranı sahneyi oyun sırasında göstermediği için
   * tahtalar, yanlış denemeler ve ipuçları burada hikâye olarak akar.
   */
  function replay(events: readonly ReplayEvent[], options: ReplayOptions = {}) {
    start()
    const stagger = Math.max(120, options.stagger ?? 420)
    const startDelay = Math.max(0, options.startDelay ?? 500)
    let index = 0
    const step = () => {
      const event = events[index++]
      if (event === 'correct') onCorrect()
      else if (event === 'wrong') onWrong()
      else if (event === 'hint') onHint()
      if (index < events.length) replayTimer = window.setTimeout(step, stagger)
    }
    if (events.length > 0) replayTimer = window.setTimeout(step, startDelay)
  }

  // Doküman §4.3 seçim ve doğrulama
  function pick(k: number) {
    const q = question.value
    if (!q || inputLocked.value || picked.value.length >= 2) return
    sfx.tap()
    if (picked.value[0] === k) {
      picked.value = []
      return
    }
    picked.value = [...picked.value, k]
    if (picked.value.length < 2) return
    const [a, b] = picked.value as [number, number]
    if (isCorrectPair(q, a, b)) {
      resolution.value = 'correct'
      onCorrect()
    } else {
      resolution.value = 'wrong'
      ringShake.value++
      onWrong()
      wrongTimer = window.setTimeout(() => {
        picked.value = []
        resolution.value = 'none'
      }, CFG.wrongResetDelayMs)
    }
  }

  function onHug() {
    bubble.value = HUG_BUBBLE
  }

  function showFinale() {
    finaleVisible.value = true
    // native taraf "Devam" düğmesini bu olayla açar (doküman §12.1)
    sendToNative('finale')
  }

  function setMuted(v: boolean) {
    muted.value = v
    sfx.setMuted(v)
  }

  return {
    solved, placed, status, question, picked, resolution,
    bubble, sign, signPulse, ringShake, finaleVisible, muted,
    isKeyQuestion, questionLabel, unlocked, inputLocked, equation,
    attachScene, start, pick, onCorrect, onWrong, onHint, replay, onHug, showFinale, setMuted,
  }
})
