<script setup lang="ts">
import { useGameStore } from '@/game/state'

const game = useGameStore()
</script>

<template>
  <div class="bubble" role="status">{{ game.bubble }}</div>
</template>

<style scoped>
.bubble {
  position: absolute;
  right: 10px;
  bottom: 10px;
  max-width: 66%;
  background: var(--sign);
  color: var(--sign-ink);
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.2;
  padding: 7px 12px 5px;
  border-radius: 14px 14px 14px 4px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
}
</style>
