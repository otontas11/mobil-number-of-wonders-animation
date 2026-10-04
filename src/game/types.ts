// Vue (durum) ile three.js sahnesi arasındaki küçük olay arayüzü (doküman §11.2 ilkesi).

/** Durumun sahneye verdiği komutlar. */
export interface SceneHandle {
  reset(): void
  addPlank(index: number): void
  cheer(): void
  sad(): void
  /** İpucu alındı: kaşif köprüyü işaret eder (doküman §12.2). */
  hint(): void
  startRescue(): void
}

/** Sahnenin zaman çizelgesinden duruma/sese bildirdiği olaylar. */
export type SceneEvent =
  | { type: 'lockBreak' }
  | { type: 'doorCreak' }
  | { type: 'bark' }
  | { type: 'step' }
  | { type: 'hug'; x: number; y: number } // ekran koordinatı (kalpler için)
  | { type: 'finale' }

export type SceneListener = (e: SceneEvent) => void
