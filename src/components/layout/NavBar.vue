<script setup lang="ts">
import { useAppStore } from '@/stores/app.store'
import { SettingsOutlined } from '@vicons/material'

const appStore = useAppStore()

defineProps<{
  title?: string
}>()
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-100 flex items-center justify-between px-4">
    <!-- 左侧标题 -->
    <h1 class="text-lg font-semibold text-gray-800">
      {{ title || '文档智搜 Pro' }}
    </h1>
    
    <!-- 右侧设置按钮 -->
    <button
      class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
      @click="appStore.openSettings"
      aria-label="设置"
    >
      <SettingsOutlined class="w-5 h-5" />
    </button>
  </header>
</template>
