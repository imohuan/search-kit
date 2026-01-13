<script setup lang="ts">
/**
 * 文本输入区域组件
 * Requirements: 4.1
 */
import { TextAa, CursorClick, ContentPaste } from '@vicons/material'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'enter-select': []
  'paste': []
}>()

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="p-4 h-full flex flex-col space-y-2 overflow-y-auto scrollbar-hide">
    <div class="flex-1 flex flex-col gap-2">
      <label class="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <TextAa class="w-4 h-4 text-indigo-500" />
        原始文本内容
      </label>
      <textarea
        :value="modelValue"
        @input="handleInput"
        class="w-full flex-1 h-full p-4 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-white shadow-inner text-sm leading-relaxed"
        placeholder="在此处粘贴或输入需要处理的文本..."
      />
    </div>
    <div class="flex gap-2">
      <button
        @click="$emit('enter-select')"
        :disabled="!modelValue || !modelValue.trim()"
        class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
      >
        <CursorClick class="w-5 h-5" />
        进入选字模式
      </button>
      <button
        @click="$emit('paste')"
        class="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        title="从剪切板写入"
      >
        <ContentPaste class="w-5 h-5" />
        粘贴
      </button>
    </div>
  </div>
</template>
