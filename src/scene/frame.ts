import type * as THREE from 'three'

/** Her karede karakter/sahne güncelleyicilerine geçen bağlam. */
export interface FrameCtx {
  t: number
  dt: number
  rescued: boolean
  rt: number // kurtarma başladıktan sonra geçen süre
  keyPhase: boolean // köprü bitti, kilit bekleniyor
  hugging: boolean
  cheerT: number
  sadT: number
  hintT: number // ipucu tepkisi kalan süre (native köprü, doküman §12.2)
  prog: number // yerleşmiş tahta oranı 0–1
  walk: { curve: THREE.CatmullRomCurve3; start: number; dur: number }
}
