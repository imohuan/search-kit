<script setup lang="ts">
/**
 * 提取项选择弹窗组件
 * Requirements: 2.8
 */
import { computed } from 'vue'
import type { ExtractedItem } from '@/types'
import { CloseOutlined, CheckOutlined } from '@vicons/material'

const props = defineProps<{
  visible: boolean
  items: ExtractedItem[]
  currentIndex: number
}>()

const emit = defineEmits<{
  close: []
  select: [index: number]
}>()

/**
 * 获取显示列表（extractedList 已经是最新在前，直接使用）
 */
const displayItems = computed(() => {
  return props.items
})

/**
 * 检查是否为当前选中项
 */
function isCurrentItem(index: number): boolean {
  return index === props.currentIndex
}

/**
 * 处理项目点击
 */
function handleItemClick(index: number) {
  emit('select', index)
  emit('close')
}

/**
 * 截断文本
 */
function truncateText(text: string, maxLength = 30): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dropdown">
      <div v-if="visible" class="fixed inset-0 z-9999 flex items-end justify-center">
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

        <!-- 弹窗内容 -->
        <div class="dropdown-content">
          <!-- 标题栏 -->
          <div class="dropdown-header">
            <h3 class="text-lg font-medium text-gray-900">
              选择提取项
            </h3>
            <button class="close-btn" @click="emit('close')" aria-label="关闭">
              <CloseOutlined class="w-5 h-5" />
            </button>
          </div>

          <!-- 提取项列表 -->
          <div class="item-list">
            <div v-for="(item, index) in displayItems" :key="index" class="item"
              :class="{ active: isCurrentItem(index) }" @click="handleItemClick(index)">
              <!-- 序号 -->
              <span class="item-index">
                {{ index + 1 }}
              </span>

              <!-- 文本内容 -->
              <span class="item-text">
                {{ truncateText(item.text) }}
              </span>

              <!-- 选中标记 -->
              <CheckOutlined v-if="isCurrentItem(index)" class="w-5 h-5 text-blue-500 shrink-0" />
            </div>

            <!-- 空状态 -->
            <div v-if="items.length === 0" class="empty-state">
              <p class="text-gray-500">暂无提取项</p>
              <p class="text-gray-400 text-sm">请先在提取器中提取文字</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

.dropdown-content {
  @apply relative bg-white rounded-t-2xl w-full max-w-lg;
  @apply max-h-[60vh] flex flex-col;
  @apply shadow-xl;
}

.dropdown-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply border-b border-gray-100;
}

.close-btn {
  @apply p-1.5 rounded-full text-gray-400;
  @apply hover:text-gray-600 hover:bg-gray-100;
  @apply transition-colors duration-200;
}

.item-list {
  @apply flex-1 overflow-y-auto px-4 py-2;
}

.item {
  @apply flex items-center gap-3 px-3 py-1;
  @apply rounded-lg cursor-pointer;
  @apply transition-colors duration-200;
}

.item:hover {
  @apply bg-gray-100;
}

.item.active {
  @apply bg-blue-100;
}

.item-index {
  @apply w-6 h-6 flex items-center justify-center;
  @apply text-xs font-medium text-white;
  @apply bg-indigo-600 rounded-md;
  @apply shrink-0;
}

.item-text {
  @apply flex-1 px-2 py-1 rounded;
  @apply text-gray-800 truncate;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-8;
  @apply text-center;
}

/* 动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}

.dropdown-enter-active .dropdown-content,
.dropdown-leave-active .dropdown-content {
  transition: transform 0.3s ease;
}

.dropdown-enter-from .dropdown-content {
  transform: translateY(100%);
}

.dropdown-leave-to .dropdown-content {
  transform: translateY(100%);
}
</style>
