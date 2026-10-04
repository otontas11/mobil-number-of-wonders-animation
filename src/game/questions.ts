import { CFG } from '@/config'

export interface Question {
  nums: number[]
  target: number
}

export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

// Doküman §4.2: aralıktan 6 farklı sayı, rastgele iki tanesinin toplamı hedef.
// Toplamı hedefe eşit her çift doğru kabul edilir.
export function newQuestion(): Question {
  const [lo, hi] = CFG.numberRange
  const set = new Set<number>()
  while (set.size < CFG.ringSize) set.add(rnd(lo, hi))
  const nums = [...set]
  const i = rnd(0, nums.length - 1)
  let j = rnd(0, nums.length - 1)
  while (j === i) j = rnd(0, nums.length - 1)
  return { nums, target: nums[i]! + nums[j]! }
}

export function isCorrectPair(q: Question, a: number, b: number) {
  return q.nums[a]! + q.nums[b]! === q.target
}
