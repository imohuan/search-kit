<script setup lang="ts">
/**
 * 搜索框组件
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
import { FilterAltOutlined, GpsFixedOutlined, CancelOutlined } from '@vicons/material'

const props = defineProps<{
  modelValue: string
  isExact: boolean
  isSearching?: boolean
  isFilterActive?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:isExact': [value: boolean]
  search: []
  clear: []
  'open-filter': []
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

/**
 * 打开文档筛选
 */
function openFilter() {
  emit('open-filter')
}
</script>

<template>
  <div class="relative">
    <!-- 左侧筛选按钮 -->
    <button
      @click="openFilter"
      class="absolute inset-y-0 left-0 pl-3.5 flex items-center z-10 transition-colors"
      :class="isFilterActive ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'"
      title="配置搜索文档"
    >
      <FilterAltOutlined class="w-5 h-5" />
    </button>
    
    <!-- 输入框 -->
    <input
      type="text"
      class="block w-full pl-11 pr-24 py-3 bg-slate-100 border-transparent text-slate-900 placeholder-slate-400 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all text-sm font-medium"
      placeholder="输入关键词搜索..."
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    
    <!-- 右侧按钮组 -->
    <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
      <!-- 精确搜索切换 -->
      <button
        @click="toggleExact"
        class="p-1.5 rounded-lg transition-all"
        :class="isExact ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-500'"
        :title="isExact ? '精确搜索：开启' : '精确搜索：关闭'"
      >
        <GpsFixedOutlined class="w-5 h-5" />
      </button>
      
      <!-- 清除按钮 -->
      <button
        v-if="modelValue"
        @click="handleClear"
        class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
        aria-label="清空"
      >
        <CancelOutlined class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 样式已内联到模板中，无需额外样式 */
</style>
