<script setup lang="ts">
/**
 * 文档筛选弹窗组件
 * Requirements: 2.7
 */
import type { Document } from '@/types'
import { CheckBoxOutlined, CheckBoxOutlineBlankOutlined, CloseOutlined } from '@vicons/material'

const props = defineProps<{
  visible: boolean
  documents: Document[]
  selectedIds: Set<number>
}>()

const emit = defineEmits<{
  close: []
  toggle: [docId: number]
  selectAll: []
  deselectAll: []
}>()

/**
 * 检查文档是否选中
 */
function isSelected(doc: Document): boolean {
  return doc.id !== undefined && props.selectedIds.has(doc.id)
}

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
 * 处理文档点击
 */
function handleDocClick(doc: Document) {
  if (doc.id !== undefined) {
    emit('toggle', doc.id)
  }
}

/**
 * 获取选中数量
 */
function getSelectedCount(): number {
  return props.selectedIds.size
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-9999 flex items-end justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('close')"
        />
        
        <!-- 弹窗内容 -->
        <div class="modal-content">
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="text-lg font-medium text-gray-900">
              选择搜索范围
            </h3>
            <button
              class="close-btn"
              @click="emit('close')"
              aria-label="关闭"
            >
              <CloseOutlined class="w-5 h-5" />
            </button>
          </div>
          
          <!-- 快捷操作 -->
          <div class="quick-actions">
            <button
              class="action-btn"
              @click="emit('selectAll')"
            >
              全选
            </button>
            <button
              class="action-btn"
              @click="emit('deselectAll')"
            >
              取消全选
            </button>
            <span class="text-sm text-gray-500 ml-auto">
              已选 {{ getSelectedCount() }}/{{ documents.length }}
            </span>
          </div>
          
          <!-- 文档列表 -->
          <div class="doc-list">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="doc-item"
              :class="{ selected: isSelected(doc) }"
              @click="handleDocClick(doc)"
            >
              <!-- 复选框 -->
              <component
                :is="isSelected(doc) ? CheckBoxOutlined : CheckBoxOutlineBlankOutlined"
                class="w-5 h-5 shrink-0"
                :class="isSelected(doc) ? 'text-blue-500' : 'text-gray-400'"
              />
              
              <!-- 文件图标和名称 -->
              <span class="text-lg">{{ getFileIcon(doc.fileName) }}</span>
              <span class="flex-1 truncate text-gray-700">
                {{ doc.fileName }}
              </span>
            </div>
            
            <!-- 空状态 -->
            <div v-if="documents.length === 0" class="empty-state">
              <p class="text-gray-500">暂无文档</p>
              <p class="text-gray-400 text-sm">请先上传文档</p>
            </div>
          </div>
          
          <!-- 确认按钮 -->
          <div class="modal-footer">
            <button
              class="confirm-btn"
              @click="emit('close')"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

.modal-content {
  @apply relative bg-white rounded-t-2xl w-full max-w-lg;
  @apply max-h-[70vh] flex flex-col;
  @apply shadow-xl;
}

.modal-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply border-b border-gray-100;
}

.close-btn {
  @apply p-1.5 rounded-full text-gray-400;
  @apply hover:text-gray-600 hover:bg-gray-100;
  @apply transition-colors duration-200;
}

.quick-actions {
  @apply flex items-center gap-2 px-4 py-2;
  @apply border-b border-gray-100;
}

.action-btn {
  @apply px-3 py-1 text-sm rounded-md;
  @apply text-blue-600 bg-blue-50;
  @apply hover:bg-blue-100;
  @apply transition-colors duration-200;
}

.doc-list {
  @apply flex-1 overflow-y-auto px-4 py-2;
}

.doc-item {
  @apply flex items-center gap-3 px-3 py-3;
  @apply rounded-lg cursor-pointer;
  @apply transition-colors duration-200;
}

.doc-item:hover {
  @apply bg-gray-50;
}

.doc-item.selected {
  @apply bg-blue-50;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-8;
  @apply text-center;
}

.modal-footer {
  @apply px-4 py-3 border-t border-gray-100;
}

.confirm-btn {
  @apply w-full py-2.5 rounded-xl;
  @apply bg-blue-500 text-white font-medium;
  @apply hover:bg-blue-600;
  @apply transition-colors duration-200;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content {
  transform: translateY(100%);
}

.modal-leave-to .modal-content {
  transform: translateY(100%);
}
</style>
