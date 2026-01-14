<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SearchOutlined,
  SearchFilled,
  LibraryBooksOutlined,
  LibraryBooksFilled,
  SelectAllOutlined,
  SelectAllFilled
} from '@vicons/material'
import type { RouteName } from '@/types'

const route = useRoute()
const router = useRouter()

/**
 * Tab配置
 */
interface TabItem {
  name: RouteName
  label: string
  iconOutlined: typeof SearchOutlined
  iconFilled: typeof SearchFilled
}

const tabs: TabItem[] = [
  {
    name: 'search',
    label: '智能搜索',
    iconOutlined: SearchOutlined,
    iconFilled: SearchFilled
  },
  {
    name: 'library',
    label: '文档库',
    iconOutlined: LibraryBooksOutlined,
    iconFilled: LibraryBooksFilled
  },
  {
    name: 'extractor',
    label: '选字提取',
    iconOutlined: SelectAllOutlined,
    iconFilled: SelectAllFilled
  }
]

/**
 * 当前激活的Tab
 */
const activeTab = computed(() => route.name as RouteName)

/**
 * 切换Tab
 */
function switchTab(name: RouteName) {
  if (activeTab.value !== name) {
    router.push({ name })
  }
}

/**
 * 获取Tab样式
 */
function getTabClass(name: RouteName) {
  const base = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95'
  const isActive = activeTab.value === name
  return `${base} ${isActive ? 'text-indigo-600' : 'text-slate-400'}`
}

/**
 * 获取Tab图标组件
 */
function getTabIcon(tab: TabItem) {
  return activeTab.value === tab.name ? tab.iconFilled : tab.iconOutlined
}
</script>

<template>
  <nav class="h-14 bg-white border-t border-slate-200 z-20 flex">
    <button v-for="tab in tabs" :key="tab.name" :class="getTabClass(tab.name)" @click="switchTab(tab.name)"
      :aria-label="tab.label" :aria-current="activeTab === tab.name ? 'page' : undefined">
      <component :is="getTabIcon(tab)" class="w-6 h-6" />
      <span class="text-xs">{{ tab.label }}</span>
    </button>
  </nav>
</template>
