<template>
  <div class="game-player">
    <div class="game-stage">
      <div class="game-device">
        <iframe
          :src="gameSrc"
          class="game-iframe"
          allow="fullscreen; autoplay"
        />
      </div>
    </div>
    <button class="back-btn" @click="goBack">← 返回</button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const gameSrc = `${import.meta.env.BASE_URL}game/index.html`;

function goBack() {
  router.push("/admin/dashboard");
}
</script>

<style scoped>
.game-player {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: #101012;
}

/* 舞台：居中承载手机比例画面，内容全部限定在设备框内 */
.game-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

/* 手机比例设备框（9:16 竖屏），高度优先、宽度自适应，永不出界 */
.game-device {
  height: min(calc(100vh - 32px), calc((100vw - 32px) * 16 / 9));
  aspect-ratio: 9 / 16;
  max-width: calc(100vw - 32px);
  border-radius: 14px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 16px 48px rgb(0 0 0 / 45%);
}

.game-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

/* 返回按钮悬浮于舞台角落，不压游戏画面 */
.back-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.back-btn:active {
  background: rgba(0, 0, 0, 0.8);
}
</style>
