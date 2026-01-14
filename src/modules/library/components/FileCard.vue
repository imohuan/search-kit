<script setup lang="ts">
/**
 * 文档卡片组件
 * Requirements: 5.3, 5.4, 5.5, 5.6
 */
import type { Document } from '@/types'
import { DescriptionOutlined, DeleteOutlined } from '@vicons/material'

const props = defineProps<{
  document: Document
}>()

const emit = defineEmits<{
  click: [doc: Document]
  delete: [doc: Document]
}>()

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 获取内容大小（单位：k字）
 */
function getContentSize(content: string): string {
  return (content.length / 1000).toFixed(1)
}

/**
 * 处理删除点击
 */
function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.document)
}
</script>

<template>
  <div
    class="file-card"
    @click="emit('click', document)"
  >
    <!-- 文件图标和信息 -->
    <div class="flex items-center gap-3 flex-1 overflow-hidden">
      <div class="file-icon-container">
        <DescriptionOutlined class="file-icon" />
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="file-name">{{ document.fileName }}</h4>
        <p class="file-meta">
          {{ formatDate(document.date) }} · {{ getContentSize(document.content) }}k 字
        </p>
      </div>
    </div>
    
    <!-- 删除按钮 -->
    <button
      class="delete-btn"
      title="删除文档"
      @click="handleDelete"
    >
      <DeleteOutlined class="delete-icon" />
    </button>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.file-card {
  @apply bg-white p-3 rounded-xl border border-slate-100 shadow-sm;
  @apply flex items-center justify-between;
  @apply cursor-pointer transition-all duration-200;
  @apply active:bg-slate-50;
}

.file-icon-container {
  @apply w-10 h-10 rounded-lg bg-indigo-50;
  @apply flex items-center justify-center;
  @apply text-indigo-600 shrink-0;
}

.file-icon {
  @apply text-xl;
}

.file-name {
  @apply text-sm font-bold text-slate-700 truncate;
}

.file-meta {
  @apply text-xs text-slate-400 mt-0.5;
}

.delete-btn {
  @apply p-2 text-slate-300;
  @apply hover:text-red-500;
  @apply transition-colors duration-200;
  @apply shrink-0;
}

.delete-icon {
  @apply text-lg;
}
</style>
