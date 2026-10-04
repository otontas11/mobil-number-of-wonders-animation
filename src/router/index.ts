import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: base './' ile WebView'da file:// / appassets üzerinden de çalışır (doküman §12).
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'rescue',
      component: () => import('@/views/GameView.vue'),
    },
  ],
})

export default router
