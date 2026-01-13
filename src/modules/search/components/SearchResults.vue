<script setup lang="ts">
/**
 * 搜索结果列表组件
 * Requirements: 2.4
 */
import type { SearchResult } from '@/types'
import ResultCard from './ResultCard.vue'

defineProps<{
  results: SearchResult[]
  fontSize?: number
  isSearching?: boolean
  query?: string
}>()

const emit = defineEmits<{
  'result-click': [result: SearchResult]
}>()
</script>

<template>
  <div class="search-results">
    <!-- 加载状态 -->
    <div v-if="isSearching" class="loading-state">
      <div class="spinner" />
      <span class="text-gray-500">搜索中...</span>
    </div>
    
    <!-- 空状态 - 无搜索词 -->
    <div v-else-if="!query?.trim()" class="empty-state">
      <span class="text-4xl mb-2">🔍</span>
      <p class="text-gray-500">输入关键词开始搜索</p>
    </div>
    
    <!-- 空状态 - 无结果 -->
    <div v-else-if="results.length === 0" class="empty-state">
      <span class="text-4xl mb-2">😕</span>
      <p class="text-gray-500">未找到匹配结果</p>
      <p class="text-gray-400 text-sm mt-1">试试其他关键词</p>
    </div>
    
    <!-- 结果列表 -->
    <div v-else class="results-list">
      <!-- 结果数量 -->
      <div class="result-count">
        找到 <span class="font-medium text-blue-600">{{ results.length }}</span> 条结果
      </div>
      
      <!-- 结果卡片 -->
      <ResultCard
        v-for="(result, index) in results"
        :key="`${result.id}-${result.matchIndex}-${index}`"
        :result="result"
        :font-size="fontSize"
        @click="emit('result-click', result)"
      />
    </div>
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

.result-count {
  @apply text-sm text-gray-500 mb-1;
}
</style>
