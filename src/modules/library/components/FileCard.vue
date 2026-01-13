<script setup lang="ts">
/**
 * 文档卡片组件
 * Requirements: 3.3, 3.6
 */
import type { Document } from '@/types'

const props = defineProps<{
  document: Document
}>()

const emit = defineEmits<{
  click: [doc: Document]
  delete: [doc: Document]
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
 * 获取内容预览
 */
function getPreview(content: string, maxLength = 80): string {
  const text = content.replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
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
    <!-- 文件图标和名称 -->
    <div class="flex items-start gap-3">
      <span class="text-2xl shrink-0">{{ getFileIcon(document.fileName) }}</span>
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-gray-900 truncate">
          {{ document.fileName }}
        </h3>
        <p class="text-xs text-gray-400 mt-0.5">
          {{ formatDate(document.date) }}
        </p>
      </div>
      
      <!-- 删除按钮 -->
      <button
        class="delete-btn"
        title="删除文档"
        @click="handleDelete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </div>
    
    <!-- 内容预览 -->
    <p class="text-sm text-gray-500 mt-2 line-clamp-2">
      {{ getPreview(document.content) }}
    </p>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.file-card {
  @apply bg-white rounded-xl p-4 shadow-sm;
  @apply border border-gray-100;
  @apply cursor-pointer transition-all duration-200;
}

.file-card:hover {
  @apply shadow-md border-gray-200;
}

.file-card:active {
  @apply scale-[0.98];
}

.delete-btn {
  @apply p-1.5 rounded-lg text-gray-400;
  @apply hover:text-red-500 hover:bg-red-50;
  @apply transition-colors duration-200;
  @apply shrink-0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
