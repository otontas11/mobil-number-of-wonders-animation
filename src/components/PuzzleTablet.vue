<script setup lang="ts">
import { CFG } from '@/config'
import { useGameStore } from '@/game/state'
import NumberRing from './NumberRing.vue'

const game = useGameStore()
</script>

<template>
  <section class="tablet" aria-live="polite">
    <div class="left">
      <div class="target" :class="{ key: game.isKeyQuestion }">{{ game.question?.target ?? '' }}</div>
      <div class="tags">
        <div class="tag">İşlem: {{ CFG.operation }}</div>
        <div class="tag">Adım: {{ CFG.steps }}</div>
      </div>
      <div class="eq">{{ game.equation }}</div>
    </div>
    <NumberRing />
  </section>
</template>

<style scoped>
.tablet {
  flex: none;
  padding: 12px 12px 14px;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.07) 0 14%, transparent 15%),
    radial-gradient(circle at 85% 75%, rgba(0, 0, 0, 0.1) 0 12%, transparent 13%),
    linear-gradient(160deg, #7b7872, #5a5752);
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.08), 0 -6px 0 rgba(0, 0, 0, 0.18);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.target {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #2f5d96, var(--navy));
  color: #fff;
  border-radius: 16px;
  font-size: clamp(2.4rem, 11vw, 3.2rem);
  font-weight: 800;
  line-height: 1;
  min-height: 1em;
  padding: 8px 0 2px;
  box-shadow: 0 0 0 3px #8fd3ff, 0 0 16px 3px rgba(79, 182, 255, 0.7), inset 0 -5px 0 var(--navy-dark);
  transition: box-shadow 0.3s, background 0.3s;
}
.target.key {
  background: linear-gradient(180deg, #d9a520, #a87610);
  box-shadow: 0 0 0 3px #ffe9a0, 0 0 20px 5px rgba(255, 212, 71, 0.85), inset 0 -5px 0 #7d5608;
}
.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  background: var(--sign);
  color: var(--sign-ink);
  font-weight: 800;
  border-radius: 8px;
  padding: 3px 10px 1px;
  font-size: 0.95rem;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}
.eq {
  text-align: center;
  background: var(--sign);
  color: var(--sign-ink);
  font-size: clamp(1.3rem, 6vw, 1.65rem);
  font-weight: 800;
  line-height: 1;
  padding: 8px 6px 4px;
  border-radius: 12px;
  box-shadow: inset 0 -4px 0 rgba(94, 58, 29, 0.25), 0 4px 0 rgba(0, 0, 0, 0.28);
}
</style>
