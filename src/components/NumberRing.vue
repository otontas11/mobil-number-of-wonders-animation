<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/game/state'

const game = useGameStore()

// çember üzerinde eşit aralıklı düğmeler (viewBox 0–100, yarıçap 36)
const nodes = computed(() => {
  const nums = game.question?.nums ?? []
  return nums.map((v, k) => {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / nums.length
    return { v, k, x: 50 + Math.cos(a) * 36, y: 50 + Math.sin(a) * 36 }
  })
})

const link = computed(() => {
  const [a, b] = game.picked
  if (a === undefined || b === undefined) return null
  const na = nodes.value[a], nb = nodes.value[b]
  if (!na || !nb) return null
  return { x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, color: game.resolution === 'wrong' ? '#e0574f' : '#ffd447' }
})

const isPicked = (k: number) => game.picked.includes(k)

const shaking = ref(false)
let shakeTimer = 0
watch(
  () => game.ringShake,
  () => {
    shaking.value = false
    clearTimeout(shakeTimer)
    requestAnimationFrame(() => (shaking.value = true))
    shakeTimer = window.setTimeout(() => (shaking.value = false), 400)
  },
)
</script>

<template>
  <div class="ring" :class="{ shake: shaking }">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id="gl" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="36" fill="none" stroke="#4a4844" stroke-width="5" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#8d8a84" stroke-width="2.2" />
      <line
        v-if="link"
        :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2"
        :stroke="link.color"
        stroke-width="3" stroke-linecap="round" filter="url(#gl)"
      />
    </svg>
    <button
      v-for="n in nodes"
      :key="`${game.question?.target}-${n.k}-${n.v}`"
      type="button"
      class="node"
      :class="{ sel: isPicked(n.k), bad: isPicked(n.k) && game.resolution === 'wrong' }"
      :style="{ left: `${n.x}%`, top: `${n.y}%` }"
      :disabled="game.inputLocked"
      :aria-label="`Sayı ${n.v}`"
      @click="game.pick(n.k)"
    >
      {{ n.v }}
    </button>
  </div>
</template>

<style scoped>
.ring {
  position: relative;
  width: min(48vw, 200px, 27dvh);
  aspect-ratio: 1;
}
.ring svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.node {
  position: absolute;
  width: 27%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  font: inherit;
  font-weight: 800;
  font-size: clamp(1.1rem, 5.4vw, 1.5rem);
  color: #fff;
  cursor: pointer;
  padding: 3px 0 0;
  background: radial-gradient(circle at 35% 30%, #3b5f8f, var(--navy-dark));
  border: 3px solid #9aa3ad;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  transition: box-shadow 0.2s, border-color 0.2s;
  touch-action: manipulation;
}
.node.sel {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(255, 212, 71, 0.5), 0 0 14px 5px rgba(255, 212, 71, 0.75);
}
.node.bad {
  border-color: var(--bad);
  box-shadow: 0 0 0 3px rgba(224, 87, 79, 0.5), 0 0 12px 4px rgba(224, 87, 79, 0.7);
}
.node:disabled {
  cursor: default;
}
.node:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
.ring.shake {
  animation: shake 0.35s;
}
@keyframes shake {
  25% {
    transform: translateX(-7px);
  }
  50% {
    transform: translateX(7px);
  }
  75% {
    transform: translateX(-4px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ring.shake {
    animation: none;
  }
}
</style>
