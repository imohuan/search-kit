<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  SearchOutlined, 
  FolderOutlined, 
  TextFieldsOutlined 
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
  icon: typeof SearchOutlined
}

const tabs: TabItem[] = [
  { name: 'search', label: '搜索', icon: SearchOutlined },
  { name: 'library', label: '文档库', icon: FolderOutlined },
  { name: 'extractor', label: '提取器', icon: TextFieldsOutlined }
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
  const base = 'flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors'
  const isActive = activeTab.value === name
  return `${base} ${isActive ? 'text-blue-500' : 'text-gray-500'}`
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 z-100 flex">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      :class="getTabClass(tab.name)"
      @click="switchTab(tab.name)"
      :aria-label="tab.label"
      :aria-current="activeTab === tab.name ? 'page' : undefined"
    >
      <component :is="tab.icon" class="w-5 h-5" />
      <span class="text-xs">{{ tab.label }}</span>
    </button>
  </nav>
</template>
