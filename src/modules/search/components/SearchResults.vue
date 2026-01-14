<script setup lang="ts">
/**
 * 搜索结果列表组件
 * Requirements: 2.4
 */
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useSearchStore } from '@/stores/search.store'
import type { SearchResult } from '@/types'
import ResultCard from './ResultCard.vue'
import DisplayOptionsMenu, { type DisplayOptions } from './DisplayOptionsMenu.vue'
import { SearchOffFilled, SentimentDissatisfiedOutlined, TuneOutlined } from '@vicons/material'

const props = defineProps<{
  results: SearchResult[]
  fontSize?: number
  isSearching?: boolean
  query?: string
}>()

const emit = defineEmits<{
  'result-click': [result: SearchResult]
}>()

const searchStore = useSearchStore()

// 滚动容器引用
const scrollContainer = ref<HTMLElement | null>(null)

// 显示选项弹窗状态
const showOptionsMenu = ref(false)

// 显示选项状态（持久化到 localStorage）
const displayOptions = useStorage<DisplayOptions>('search-display-options', {
  showTitle: true,
  showSpan: true,
  showPosition: true,
  showDetail: true,
  compact: false
})

// 检查是否有选项被关闭（用于高亮按钮）
function hasCustomOptions(): boolean {
  const opts = displayOptions.value
  return !opts.showTitle || !opts.showSpan || !opts.showPosition || !opts.showDetail || opts.compact
}

// 保存滚动位置
function saveScrollPosition() {
  if (scrollContainer.value) {
    searchStore.setScrollTop(scrollContainer.value.scrollTop)
  }
}

// 恢复滚动位置
function restoreScrollPosition() {
  nextTick(() => {
    if (scrollContainer.value && searchStore.scrollTop > 0) {
      scrollContainer.value.scrollTop = searchStore.scrollTop
    }
  })
}

// 监听结果变化，有结果时恢复滚动位置
watch(() => props.results, (newResults) => {
  if (newResults.length > 0) {
    restoreScrollPosition()
  }
}, { immediate: true })

onMounted(() => {
  // 组件挂载时恢复滚动位置
  restoreScrollPosition()
})

onBeforeUnmount(() => {
  // 组件卸载前保存滚动位置
  saveScrollPosition()
})
</script>

<template>
  <div ref="scrollContainer" class="search-results" @scroll="saveScrollPosition">
    <!-- 加载状态 -->
    <div v-if="isSearching" class="loading-state">
      <div class="spinner" />
      <span class="text-gray-500">搜索中...</span>
    </div>

    <!-- 空状态 - 无搜索词 -->
    <div v-else-if="!query?.trim()" class="empty-state">
      <SearchOffFilled class="text-gray-400 mb-2 size-10" />
      <p class="text-gray-500">输入关键词开始搜索</p>
    </div>

    <!-- 空状态 - 无结果 -->
    <div v-else-if="results.length === 0" class="empty-state">
      <SentimentDissatisfiedOutlined class="text-gray-400 mb-2 size-10" />
      <p class="text-gray-500">未找到匹配结果</p>
      <p class="text-gray-400 text-sm mt-1">试试其他关键词</p>
    </div>

    <!-- 结果列表 -->
    <div v-else class="results-list">
      <!-- 结果数量和显示选项 -->
      <div class="result-header">
        <div class="result-count">
          找到 <span class="font-medium text-blue-600">{{ results.length }}</span> 条结果
        </div>
        <button @click="showOptionsMenu = true" class="p-1.5 rounded-lg transition-colors"
          :class="hasCustomOptions() ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'" title="显示选项">
          <TuneOutlined class="w-5 h-5" />
        </button>
      </div>

      <!-- 结果卡片 -->
      <ResultCard v-for="(result, index) in results" :key="`${result.id}-${result.matchIndex}-${index}`"
        :result="result" :font-size="fontSize" :display-options="displayOptions"
        @click="emit('result-click', result)" />
    </div>

    <!-- 显示选项弹窗 -->
    <DisplayOptionsMenu v-model:visible="showOptionsMenu" v-model:options="displayOptions" />
  </div>
</template>

<style scoped>
@reference "@/style.css";

.search-results {
  @apply flex-1 overflow-y-auto;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center;
  @apply h-full min-h-[200px];
  @apply text-center;
}

.spinner {
  @apply w-8 h-8 border-3 border-gray-200 border-t-blue-500;
  @apply rounded-full animate-spin mb-3;
}

.results-list {
  @apply flex flex-col gap-3 p-4;
}

.result-header {
  @apply flex items-center justify-between mb-1;
}

.result-count {
  @apply text-sm text-gray-500;
}
</style>
