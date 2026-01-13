<script setup lang="ts">
/**
 * 搜索结果卡片组件
 * Requirements: 2.4
 */
import type { SearchResult } from '@/types'

const props = defineProps<{
  result: SearchResult
  fontSize?: number
}>()

const emit = defineEmits<{
  click: [result: SearchResult]
}>()

/**
 * 获取文件图标
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    txt: '📃'
  }
  return icons[ext] || '📄'
}
</script>

<template>
  <div
    class="result-card"
    @click="emit('click', result)"
  >
    <!-- 文件名和图标 -->
    <div class="flex items-center gap-2 mb-2">
      <span class="text-lg">{{ getFileIcon(result.fileName) }}</span>
      <span class="text-sm font-medium text-gray-700 truncate">
        {{ result.fileName }}
      </span>
    </div>
    
    <!-- 高亮片段 -->
    <div
      class="snippet"
      :style="{ fontSize: `${fontSize || 14}px` }"
      v-html="result.highlightedSnippet"
    />
  </div>
</template>

<style scoped>  
@reference "@/style.css";

.result-card {
  @apply bg-white rounded-xl p-4 shadow-sm;
  @apply border border-gray-100;
  @apply cursor-pointer transition-all duration-200;
}

.result-card:hover {
  @apply shadow-md border-gray-200;
}

.result-card:active {
  @apply scale-[0.98];
}

.snippet {
  @apply text-gray-600 leading-relaxed;
  @apply break-all;
}

.snippet :deep(mark) {
  @apply bg-yellow-200 text-yellow-900 px-0.5 rounded;
}
</style>
