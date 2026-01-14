<script setup lang="ts">
/**
 * 搜索结果卡片组件
 * Requirements: 4.5, 4.6
 */
import { DescriptionOutlined } from '@vicons/material'
import type { SearchResult } from '@/types'
import type { DisplayOptions } from './DisplayOptionsMenu.vue'

withDefaults(defineProps<{
  result: SearchResult
  fontSize?: number
  displayOptions?: DisplayOptions
}>(), {
  displayOptions: () => ({
    showTitle: true,
    showSpan: true,
    showPosition: true,
    showDetail: true,
    compact: false
  })
})

const emit = defineEmits<{
  click: [result: SearchResult]
}>()
</script>

<template>
  <div
    class="bg-white rounded-xl border border-slate-100 shadow-sm active:scale-[0.99] active:bg-slate-50 transition-all cursor-pointer"
    :class="displayOptions.compact ? 'p-2' : 'p-4'" @click="emit('click', result)">
    <!-- 文件名和匹配跨度 badge -->
    <div v-if="displayOptions.showTitle || displayOptions.showSpan" class="flex items-center gap-2"
      :class="displayOptions.compact ? 'mb-1' : 'mb-2'">
      <template v-if="displayOptions.showTitle">
        <DescriptionOutlined class="text-indigo-500 shrink-0" :class="displayOptions.compact ? 'w-4 h-4' : 'w-5 h-5'" />
        <h3 class="font-bold text-slate-700 truncate flex-1" :class="displayOptions.compact ? 'text-xs' : 'text-sm'">
          {{ result.fileName }}
        </h3>
      </template>
      <div v-else class="flex-1" />
      <!-- 匹配跨度 badge -->
      <span v-if="displayOptions.showSpan" class="text-indigo-600 bg-indigo-50 rounded shrink-0"
        :class="displayOptions.compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'">
        跨度 {{ result.matchLength }} 字
      </span>
    </div>

    <!-- 高亮片段 -->
    <div
      class="text-slate-600 leading-relaxed bg-slate-50/50 rounded-lg border border-slate-50 transition-all doc-content-render"
      :class="displayOptions.compact ? 'p-2' : 'p-3'"
      :style="{ fontSize: `${fontSize || 14}px`, lineHeight: displayOptions.compact ? '1.4' : '1.6' }"
      v-html="result.highlightedSnippet" />

    <!-- 底部信息 -->
    <div v-if="displayOptions.showPosition || displayOptions.showDetail"
      class="flex justify-between items-center text-slate-400"
      :class="displayOptions.compact ? 'mt-1 text-[10px]' : 'mt-2 text-xs'">
      <span v-if="displayOptions.showPosition">位置: {{ result.matchIndex }}</span>
      <span v-else />
      <span v-if="displayOptions.showDetail" class="text-indigo-600 font-medium flex items-center gap-1">
        查看详情
      </span>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style.css";

/* 高亮样式 - 与 DetailModal 保持一致 */
:deep(mark),
:deep(mark.highlight) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
  border-bottom: 2px solid #eab308;
}

/* docx 段落样式 - 确保换行显示 */
:deep(.docx-p) {
  display: block !important;
  min-height: 1.2em;
  margin-bottom: 0.5em;
  line-height: 1.6;
  word-wrap: break-word;
}

/* docx 换行标签强制换行 */
:deep(.docx-br) {
  display: block;
  content: "";
  margin-bottom: 0.3em;
}

/* 文档内容渲染样式 */
:deep(.doc-content-render) {
  color: #475569;
  line-height: 1.6;
  word-break: break-word;
}
</style>
