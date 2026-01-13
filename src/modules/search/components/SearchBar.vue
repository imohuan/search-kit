<script setup lang="ts">
/**
 * 搜索框组件
 * Requirements: 2.1, 2.2
 */
import { SearchOutlined, CloseOutlined } from '@vicons/material'

const props = defineProps<{
  modelValue: string
  isExact: boolean
  isSearching?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:isExact': [value: boolean]
  search: []
  clear: []
}>()

/**
 * 处理输入
 */
function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

/**
 * 处理回车搜索
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    emit('search')
  }
}

/**
 * 清空搜索
 */
function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

/**
 * 切换精确搜索
 */
function toggleExact() {
  emit('update:isExact', !props.isExact)
}
</script>

<template>
  <div class="search-bar">
    <!-- 搜索图标 -->
    <SearchOutlined class="search-icon" />
    
    <!-- 输入框 -->
    <input
      type="text"
      class="search-input"
      placeholder="输入关键词搜索..."
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    
    <!-- 清空按钮 -->
    <button
      v-if="modelValue"
      class="clear-btn"
      @click="handleClear"
      aria-label="清空"
    >
      <CloseOutlined class="w-4 h-4" />
    </button>
    
    <!-- 精确搜索切换 -->
    <button
      class="exact-btn"
      :class="{ active: isExact }"
      @click="toggleExact"
      :title="isExact ? '精确搜索已开启' : '点击开启精确搜索'"
    >
      精确
    </button>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.search-bar {
  @apply flex items-center gap-2 px-3 py-2;
  @apply bg-gray-100 rounded-xl;
  @apply transition-all duration-200;
}

.search-bar:focus-within {
  @apply bg-white ring-2 ring-blue-500/30;
}

.search-icon {
  @apply w-5 h-5 text-gray-400 shrink-0;
}

.search-input {
  @apply flex-1 bg-transparent outline-none;
  @apply text-gray-800 placeholder-gray-400;
  @apply text-base;
}

.clear-btn {
  @apply p-1 rounded-full text-gray-400;
  @apply hover:text-gray-600 hover:bg-gray-200;
  @apply transition-colors duration-200;
  @apply shrink-0;
}

.exact-btn {
  @apply px-2 py-1 text-xs font-medium rounded-md;
  @apply text-gray-500 bg-gray-200;
  @apply transition-all duration-200;
  @apply shrink-0;
}

.exact-btn.active {
  @apply text-white bg-blue-500;
}

.exact-btn:hover:not(.active) {
  @apply bg-gray-300;
}
</style>
