<script setup lang="ts">
import { useAppStore } from '@/stores/app.store'
import { SettingsOutlined, ArticleOutlined } from '@vicons/material'

const appStore = useAppStore()

defineProps<{
  title?: string
}>()
</script>

<template>
  <header class="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
    <!-- 左侧标题 -->
    <h1 class="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
      <ArticleOutlined class="text-indigo-600 text-xl" />
      文档智搜 <span class="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-medium">Pro</span>
    </h1>
    
    <!-- 右侧设置按钮 -->
    <button
      class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
      @click="appStore.openSettings"
      aria-label="设置"
    >
      <SettingsOutlined class="w-5 h-5" />
    </button>
  </header>
</template>
