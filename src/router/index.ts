import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/search'
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/modules/search/pages/SearchView.vue'),
    meta: {
      title: '搜索',
      keepAlive: true
    }
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/modules/library/pages/LibraryView.vue'),
    meta: {
      title: '文档库',
      keepAlive: true
    }
  },
  {
    path: '/extractor',
    name: 'extractor',
    component: () => import('@/modules/extractor/pages/ExtractorView.vue'),
    meta: {
      title: '选字提取',
      keepAlive: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
