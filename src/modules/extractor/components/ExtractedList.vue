<script setup lang="ts">
/**
 * 提取结果列表组件
 * Requirements: 6.7
 *
 * 显示已提取的文字列表，最新的在前面
 */
import { SelectAllOutlined, ContentCopyOutlined, DeleteOutlined } from '@vicons/material'
import type { ExtractedItem } from '@/types'

defineProps<{
  extractedList: ExtractedItem[]
}>()

const emit = defineEmits<{
  'edit': [index: number]
  'copy': [text: string]
  'remove': [index: number]
}>()
</script>

<template>
  <div class="h-full overflow-y-auto p-4 space-y-3 bg-slate-50/50 scrollbar-hide pb-20">
    <!-- 空状态 -->
    <div v-if="extractedList.length === 0"
      class="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
      <SelectAllOutlined class="w-12 h-12 mb-3" />
      <p class="text-sm">尚未提取任何文字</p>
    </div>

    <!-- 提取项列表 -->
    <div v-for="(item, idx) in extractedList" :key="idx"
      class="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm group">
      <div @click="$emit('edit', idx)" class="flex-1 cursor-pointer">
        <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1 block">
          项目 #{{ extractedList.length - idx }}
        </span>
        <p class="text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
          {{ item.text }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button @click="$emit('copy', item.text)" class="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
          title="复制">
          <ContentCopyOutlined class="w-5 h-5" />
        </button>
        <button @click="$emit('remove', idx)" class="p-2 text-slate-300 hover:text-red-500 transition-colors"
          title="删除">
          <DeleteOutlined class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
