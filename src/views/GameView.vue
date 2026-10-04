<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import * as sfx from '@/audio/sfx'
import FinaleOverlay from '@/components/FinaleOverlay.vue'
import Hud from '@/components/Hud.vue'
import PuzzleTablet from '@/components/PuzzleTablet.vue'
import SpeechBubble from '@/components/SpeechBubble.vue'
import { CFG, EMBED, REDUCE_MOTION } from '@/config'
import { useGameStore } from '@/game/state'
import type { SceneEvent } from '@/game/types'
import { installRescueApi } from '@/native/bridge'
import { GameScene } from '@/scene/GameScene'

const game = useGameStore()
const stageEl = ref<HTMLDivElement | null>(null)

interface Heart {
  id: number
  x: number
  y: number
  dx: number
  delay: number
}
const hearts = ref<Heart[]>([])
let heartId = 0

function spawnHearts(x: number, y: number, n = 5) {
  if (REDUCE_MOTION) return
  for (let i = 0; i < n; i++) {
    const id = ++heartId
    hearts.value.push({ id, x, y, dx: Math.random() * 90 - 45, delay: i * 0.22 })
    setTimeout(() => (hearts.value = hearts.value.filter((h) => h.id !== id)), 3000)
  }
}

// sahne zaman çizelgesi → ses ve arayüz
function onSceneEvent(e: SceneEvent) {
  switch (e.type) {
    case 'lockBreak': return sfx.lockBreak()
    case 'doorCreak': return sfx.doorCreak()
    case 'bark': return sfx.bark()
    case 'step': return sfx.step()
    case 'hug':
      game.onHug()
      sfx.bark()
      sfx.fanfare()
      spawnHearts(e.x, e.y)
      return
    case 'finale': return game.showFinale()
  }
}

// ses bağlamı ilk dokunuşta başlar (doküman §9)
const unlockAudio = () => sfx.resume()

let scene: GameScene | null = null
let uninstallApi: (() => void) | null = null

onMounted(() => {
  scene = new GameScene(stageEl.value!, game)
  scene.on(onSceneEvent)
  game.attachScene(scene)
  game.start()
  window.addEventListener('pointerdown', unlockAudio, { passive: true })
  uninstallApi = installRescueApi({
    start: () => game.start(),
    onCorrect: () => game.onCorrect(),
    onWrong: () => game.onWrong(),
    setMuted: (v) => game.setMuted(v),
    get state() {
      return { solved: game.solved, placed: game.placed, status: game.status }
    },
    config: CFG,
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', unlockAudio)
  uninstallApi?.()
  game.attachScene(null)
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div class="app" :class="{ embed: EMBED }">
    <div ref="stageEl" class="stage">
      <Hud />
      <SpeechBubble />
      <span
        v-for="h in hearts"
        :key="h.id"
        class="heart"
        :style="{ left: `${h.x}px`, top: `${h.y}px`, '--dx': `${h.dx}px`, animationDelay: `${h.delay}s` }"
      >❤️</span>
      <FinaleOverlay />
    </div>
    <!-- gömülü modda (?embed=1) soruları native uygulama gösterir -->
    <PuzzleTablet v-if="!EMBED" />
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: #2a2622;
  position: relative;
}
/* masaüstünde telefon çerçevesi */
@media (min-width: 620px) {
  .app {
    height: calc(100% - 32px);
    margin: 16px auto;
    border-radius: 30px;
    overflow: hidden;
    border: 5px solid var(--wood);
    box-shadow: 0 8px 0 var(--wood-dark), 0 20px 50px rgba(0, 0, 0, 0.4);
  }
}
.stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #5fb4e6 0%, #a6daf2 30%, #e2f2e6 48%, #bfdcae 100%);
}
.stage :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
.heart {
  position: absolute;
  font-size: 30px;
  pointer-events: none;
  animation: float 1.8s ease-out forwards;
}
@keyframes float {
  0% {
    transform: translate(-50%, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--dx)), -120px) scale(1.2);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .heart {
    animation-duration: 0.01s;
  }
}
</style>
