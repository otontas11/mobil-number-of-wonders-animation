// Web ↔ native mesajlaşma (doküman §12)

declare global {
  interface Window {
    AndroidBridge?: { postMessage(msg: string): void }
    webkit?: { messageHandlers?: { rescue?: { postMessage(msg: string): void } } }
    rescue?: RescueApi
  }
}

export interface RescueApi {
  start(): void
  onCorrect(): void
  onWrong(): void
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
