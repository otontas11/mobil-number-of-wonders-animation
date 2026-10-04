// Web ↔ native mesajlaşma (doküman §12)

declare global {
  interface Window {
    /** Native taraf gömülü modu içerik yüklenmeden önce bu bayrakla açar (doküman §12.3). */
    RESCUE_EMBED?: boolean
    /** false ise sahne kendi arayüzünü çizmez: oyunun arkasında saf 3B sahne kalır. */
    RESCUE_CHROME?: boolean
    AndroidBridge?: { postMessage(msg: string): void }
    webkit?: { messageHandlers?: { rescue?: { postMessage(msg: string): void } } }
    rescue?: RescueApi
  }
}

/** Native tarafın biriktirdiği oyun olayları (doküman §12.2 `replay`). */
export type ReplayEvent = 'correct' | 'wrong' | 'hint'

export interface ReplayOptions {
  /** İki olay arası bekleme, ms (varsayılan 420). */
  stagger?: number
  /** İlk olaydan önceki bekleme, ms (varsayılan 500). */
  startDelay?: number
}

export interface RescueApi {
  start(): void
  onCorrect(): void
  onWrong(): void
  onHint(): void
  /** Sahneyi sıfırlar, ardından olay günlüğünü sırayla oynatır. */
  replay(events: readonly ReplayEvent[], options?: ReplayOptions): void
  setMuted(muted: boolean): void
  readonly state: { solved: number; placed: number; status: string }
  readonly config: object
}

export function sendToNative(evt: string, data: object = {}) {
  const msg = JSON.stringify({ evt, ...data })
  try {
    if (window.AndroidBridge?.postMessage) return window.AndroidBridge.postMessage(msg)
    if (window.webkit?.messageHandlers?.rescue) return window.webkit.messageHandlers.rescue.postMessage(msg)
    if (window.parent !== window) window.parent.postMessage(msg, '*')
  } catch {
    /* native köprü yoksa sessizce geç */
  }
}

export function installRescueApi(api: RescueApi) {
  window.rescue = api
  return () => {
    if (window.rescue === api) delete window.rescue
  }
}
