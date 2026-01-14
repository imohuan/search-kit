<script setup lang="ts">
/**
 * 文本输入区域组件
 * Requirements: 6.1, 6.2, 6.3
 */
import { TouchAppOutlined, DeleteSweepOutlined, CloseOutlined, TextFieldsOutlined } from '@vicons/material'

defineProps<{
  modelValue: string
  hasExtractedResults?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'enter-select': []
  'clear-results': []
}>()

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function clearInput() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="p-4 h-full flex flex-col space-y-2 overflow-y-auto scrollbar-hide">
    <div class="flex-1 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <TextFieldsOutlined class="w-5 h-5 text-indigo-500" />
          原始文本内容
        </label>
        <button v-if="modelValue && modelValue.trim()" @click="clearInput"
          class=" text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
          title="清空输入框">
          <CloseOutlined class="w-5 h-5" />
        </button>
      </div>
      <textarea :value="modelValue" @input="handleInput"
        class="w-full flex-1 h-full p-4 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-white shadow-inner text-sm leading-relaxed"
        placeholder="在此处粘贴或输入需要处理的文本..." />
    </div>
    <div class="flex gap-2 items-center">
      <button @click="$emit('enter-select')" :disabled="!modelValue || !modelValue.trim()"
        class="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center gap-2">
        <TouchAppOutlined class="w-4 h-4" />
        进入选字模式
      </button>
      <button v-if="hasExtractedResults" @click="$emit('clear-results')"
        class="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200 transition-all active:scale-90 flex items-center justify-center gap-1"
        title="清空所有提取结果">
        <DeleteSweepOutlined class="w-4 h-4" />
        清空结果
      </button>
    </div>
  </div>
</template>
