import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ListView from '@/views/ListView.vue'
import JoinView from '@/views/JoinView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/list/:id',
      name: 'list',
      component: ListView,
    },
    {
      path: '/join/:code',
      name: 'join',
      component: JoinView,
    },
  ],
})

export default router
