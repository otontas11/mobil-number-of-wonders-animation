<script setup lang="ts">
import { CFG } from '@/config'
import { useGameStore } from '@/game/state'

const game = useGameStore()
</script>

<template>
  <div class="hud">
    <div class="woodsign qLabel">{{ game.questionLabel }}</div>
    <div class="right">
      <div class="prog" aria-label="İlerleme">
        <span v-for="i in CFG.planks" :key="i" class="pl" :class="{ on: i <= game.placed }" />
        <span class="key">{{ game.unlocked ? '🔓' : '🔒' }}</span>
      </div>
      <button
        type="button"
        class="sound"
        :aria-label="game.muted ? 'Sesi aç' : 'Sesi kapat'"
        :aria-pressed="game.muted"
        @click="game.setMuted(!game.muted)"
      >
        {{ game.muted ? '🔇' : '🔊' }}
      </button>
    </div>
  </div>
  <!-- key: metin her değiştiğinde eleman yeniden kurulur, pop animasyonu baştan oynar -->
  <div :key="game.signPulse" class="woodsign sceneSign pop">{{ game.sign }}</div>
</template>

<style scoped>
.hud {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}
.right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qLabel {
  font-size: 1.25rem;
  transform: rotate(-2deg);
}
.prog {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(61, 38, 18, 0.55);
  padding: 5px 8px;
  border-radius: 12px;
}
.pl {
  width: 13px;
  height: 18px;
  border-radius: 3px;
  border: 2px dashed rgba(255, 255, 255, 0.5);
}
.pl.on {
  border: 0;
  background: linear-gradient(90deg, #b07a45, #8f5c2c);
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.25);
}
.key {
  font-size: 1.05rem;
  margin-left: 4px;
  line-height: 1;
}
.sound {
  pointer-events: auto;
  font: inherit;
  font-size: 1.05rem;
  line-height: 1;
  border: 0;
  border-radius: 10px;
  padding: 6px 8px;
  background: rgba(61, 38, 18, 0.55);
  color: #fff;
  cursor: pointer;
  touch-action: manipulation;
}
.sound:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
.sceneSign {
  position: absolute;
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  white-space: nowrap;
}
.sceneSign.pop {
  animation: pop 0.45s ease-out;
}
@keyframes pop {
  0% {
    transform: translateX(-50%) scale(0.6);
  }
  70% {
    transform: translateX(-50%) scale(1.08);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sceneSign.pop {
    animation: none;
  }
}
</style>
