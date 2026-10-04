<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { FINALE_TITLE } from '@/game/messages'
import { useGameStore } from '@/game/state'

const game = useGameStore()
const again = ref<HTMLButtonElement | null>(null)

watch(
  () => game.finaleVisible,
  async (v) => {
    if (v) {
      await nextTick()
      again.value?.focus()
    }
  },
)
</script>

<template>
  <div v-if="game.finaleVisible" class="finale">
    <div class="woodsign">{{ FINALE_TITLE }}</div>
    <button ref="again" type="button" class="btn" @click="game.start()">Tekrar oyna</button>
  </div>
</template>

<style scoped>
.finale {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 18px;
  background: rgba(18, 30, 14, 0.35);
}
.finale .woodsign {
  font-size: clamp(1.7rem, 8vw, 2.4rem);
  padding: 12px 22px 8px;
  text-align: center;
}
.btn {
  font: inherit;
  font-weight: 800;
  font-size: 1.15rem;
  border: 0;
  border-radius: 14px;
  padding: 8px 26px 6px;
  background: var(--gold);
  color: var(--sign-ink);
  cursor: pointer;
  box-shadow: 0 5px 0 var(--gold-dark);
  touch-action: manipulation;
}
.btn:active {
  transform: translateY(4px);
  box-shadow: 0 1px 0 var(--gold-dark);
}
.btn:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
</style>
