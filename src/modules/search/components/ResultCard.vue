<script setup lang="ts">
/**
 * 搜索结果卡片组件
 * Requirements: 4.5, 4.6
 */
import { DescriptionOutlined } from '@vicons/material'
import type { SearchResult } from '@/types'

const props = defineProps<{
  result: SearchResult
  fontSize?: number
}>()

const emit = defineEmits<{
  click: [result: SearchResult]
}>()
</script>

<template>
  <div
    class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm active:scale-[0.99] active:bg-slate-50 transition-all cursor-pointer"
    @click="emit('click', result)"
  >
    <!-- 文件名和匹配跨度 badge -->
    <div class="flex items-center gap-2 mb-2">
      <DescriptionOutlined class="w-5 h-5 text-indigo-500 shrink-0" />
      <h3 class="font-bold text-slate-700 text-sm truncate flex-1">
        {{ result.fileName }}
      </h3>
      <!-- 匹配跨度 badge -->
      <span class="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
        跨度 {{ result.matchLength }} 字
      </span>
    </div>
    
    <!-- 高亮片段 -->
    <div
      class="text-slate-600 leading-relaxed whitespace-pre-wrap wrap-break-word bg-slate-50/50 p-3 rounded-lg border border-slate-50 transition-all"
      :style="{ fontSize: `${fontSize || 14}px`, lineHeight: '1.6' }"
      v-html="result.highlightedSnippet"
    />
    
    <!-- 底部信息 -->
    <div class="mt-2 flex justify-between items-center text-xs text-slate-400">
      <span>位置: {{ result.matchIndex }}</span>
      <span class="text-indigo-600 font-medium flex items-center gap-1">
        查看详情
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 样式已内联到模板中，无需额外样式 */
</style>
