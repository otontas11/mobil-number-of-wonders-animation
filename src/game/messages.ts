import { CFG } from '@/config'

// Doküman §8.1 metinleri
const CHEERS = ['Bir tahta daha!', 'Harika gidiyoruz!', 'Süpersin!', 'Devam, devam!', 'Çok iyi!']

export const WRONG_BUBBLE = 'Hmm, bir daha deneyelim!'
export const HINT_BUBBLE = 'Bak, yol şurada!'
export const HUG_BUBBLE = 'Kavuştuk! Seni çok özledim!'
export const FINALE_TITLE = '9 Soru, 1 Mutlu Son! 🐾'

export function bubbleFor(solved: number) {
  if (solved === 0) return 'Dayan dostum, sana köprü kuruyorum!'
  if (solved === 4) return 'Köprünün yarısı tamam!'
  if (solved === CFG.planks - 1) return 'Son tahta geliyor!'
  if (solved === CFG.planks) return 'Köprü hazır! Şimdi kilidi açalım.'
  if (solved > CFG.planks) return 'Kapı açıldı! Gel buraya dostum!'
  return CHEERS[solved % CHEERS.length]!
}

export function signFor(solved: number) {
  if (solved < CFG.planks) return 'Köprüyü kur!'
  if (solved === CFG.planks) return 'Kilidi aç! 🔑'
  return 'Kavuşma zamanı!'
}

// 9. cevaptan sonra yeni soru gelmez; etiket "Son soru"da kalır.
export function questionLabelFor(solved: number) {
  return solved >= CFG.planks ? 'Son soru' : `${solved + 1}. Soru`
}
