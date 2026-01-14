<script setup lang="ts">
/**
 * 提取器工具栏组件
 * Requirements: 6.6
 *
 * 提供选字操作的工具按钮：
 * - 隐藏空格切换
 * - 清除符号
 * - 全选
 * - 反选
 * - 清空选择
 * - 提取/更新按钮
 * - 清空所有结果
 */
import {
  ArrowBackOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  CheckBoxOutlined,
  SwapHorizOutlined,
  DeleteSweepOutlined,
  CleaningServicesOutlined,
  VisibilityOffOutlined,
  SelectAllOutlined
} from '@vicons/material'

defineProps<{
  innerTab: 'select' | 'list'
  hideSpaces: boolean
  selectedCount: number
  extractedCount: number
  editingIndex: number
}>()

defineEmits<{
  'back': []
  'toggle-hide-spaces': []
  'clear-symbols': []
  'select-all': []
  'invert-selection': []
  'clear-selection': []
  'extract': []
  'clear-all-results': []
}>()
</script>

<template>
  <div class="px-4 py-2 border-t border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm shrink-0 h-[52px]">
    <!-- 返回按钮 -->
    <button
      @click="$emit('back')"
      class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
      title="重设原文"
    >
      <ArrowBackOutlined class="w-5 h-5" />
    </button>

    <!-- 选字模式工具栏 -->
    <div
      v-if="innerTab === 'select'"
      class="flex items-center gap-0.5 bg-slate-100/50 p-0.5 rounded-xl border border-slate-100"
    >
      <!-- 隐藏空格切换 -->
      <button
        @click="$emit('toggle-hide-spaces')"
        :class="[
          'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
          hideSpaces ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
        ]"
        title="切换隐藏空格"
      >
        <VisibilityOffOutlined v-if="hideSpaces" class="w-5 h-5" />
        <SelectAllOutlined v-else class="w-5 h-5" />
      </button>

      <div class="w-px h-4 bg-slate-200 mx-0.5" />

      <!-- 清除符号 -->
      <button
        @click="$emit('clear-symbols')"
        class="w-8 h-8 flex items-center justify-center text-slate-400 active:text-indigo-600 active:bg-slate-200 rounded-lg transition-all"
        title="快速清除符号"
      >
        <CleaningServicesOutlined class="w-5 h-5" />
      </button>

      <!-- 全选 -->
      <button
        @click="$emit('select-all')"
        class="w-8 h-8 flex items-center justify-center text-slate-400 active:text-indigo-600 active:bg-slate-200 rounded-lg transition-all"
        title="全选"
      >
        <CheckBoxOutlined class="w-5 h-5" />
      </button>

      <!-- 反选 -->
      <button
        @click="$emit('invert-selection')"
        class="w-8 h-8 flex items-center justify-center text-slate-400 active:text-indigo-600 active:bg-slate-200 rounded-lg transition-all"
        title="反选"
      >
        <SwapHorizOutlined class="w-5 h-5" />
      </button>

      <!-- 清空选择 -->
      <button
        @click="$emit('clear-selection')"
        class="w-8 h-8 flex items-center justify-center text-slate-400 active:text-red-500 active:bg-red-50 rounded-lg transition-all"
        title="清空选择"
      >
        <DeleteSweepOutlined class="w-5 h-5" />
      </button>
    </div>

    <!-- 右侧操作按钮 -->
    <div class="flex items-center gap-2">
      <!-- 提取/更新按钮 -->
      <button
        v-if="innerTab === 'select'"
        @click="$emit('extract')"
        :disabled="selectedCount === 0"
        class="h-9 px-3 flex items-center gap-1.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:shadow-none transition-all"
        :title="editingIndex === -1 ? '保存提取' : '更新项目'"
      >
        <CheckCircleOutlined class="w-5 h-5" />
        <span class="text-xs font-bold leading-none">
          {{ editingIndex === -1 ? '提取' : '更新' }}
        </span>
      </button>

      <!-- 清空所有结果按钮 -->
      <button
        v-if="innerTab === 'list' && extractedCount > 0"
        @click="$emit('clear-all-results')"
        class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-100"
        title="清空所有结果"
      >
        <DeleteOutlined class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
