<script setup lang="ts">
/**
 * 文档列表组件
 * Requirements: 3.3
 */
import type { Document } from '@/types'
import FileCard from './FileCard.vue'

defineProps<{
  documents: Document[]
  loading?: boolean
}>()

const emit = defineEmits<{
  click: [doc: Document]
  delete: [doc: Document]
}>()
</script>

<template>
  <div class="file-list">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p class="text-gray-500 text-sm mt-2">加载中...</p>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="documents.length === 0" class="empty-state">
      <div class="text-4xl mb-2">📚</div>
      <p class="text-gray-500 text-sm">暂无文档</p>
      <p class="text-gray-400 text-xs mt-1">上传文档开始使用</p>
    </div>
    
    <!-- 文档列表 -->
    <TransitionGroup v-else name="list" tag="div" class="document-grid">
      <FileCard
        v-for="doc in documents"
        :key="doc.id"
        :document="doc"
        @click="emit('click', doc)"
        @delete="emit('delete', doc)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.file-list {
  @apply flex-1;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center;
  @apply py-12 text-center;
}

.loading-spinner {
  @apply w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.document-grid {
  @apply flex flex-col gap-3;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
