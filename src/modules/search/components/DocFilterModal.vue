<script setup lang="ts">
/**
 * 文档筛选弹窗组件
 * Requirements: 4.8
 */
import type { Document } from '@/types'
import { CloseOutlined, DescriptionOutlined, FilterListOutlined } from '@vicons/material'

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
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-end justify-center" @click.self="emit('close')">
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

        <!-- 弹窗内容 -->
        <div class="bg-white w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden relative" @click.stop>
          <!-- 标题栏 -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50 to-white">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FilterListOutlined class="w-5 h-5 text-indigo-600" />
              配置搜索文档
            </h3>
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="emit('close')" aria-label="关闭">
              <CloseOutlined class="w-5 h-5" />
            </button>
          </div>

          <!-- 工具栏 -->
          <div class="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <button @click="emit('selectAll')"
                class="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-all active:scale-95">
                全选
              </button>
              <button @click="emit('deselectAll')"
                class="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all active:scale-95">
                清空
              </button>
            </div>
            <div class="text-xs text-slate-500 font-medium">
              已选 <span class="text-indigo-600 font-bold">{{ getSelectedCount() }}</span> / {{ documents.length }}
            </div>
          </div>

          <!-- 文档列表 -->
          <div class="max-h-[60vh] overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
            <div v-if="documents.length === 0" class="text-center py-10 text-slate-400">
              <DescriptionOutlined class="size-10 mb-2 opacity-50" />
              <p class="text-sm">暂无文档</p>
            </div>
            <label v-for="doc in documents" :key="doc.id"
              class="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50 rounded-xl border cursor-pointer transition-all group"
              :class="isSelected(doc) ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100'">
              <input type="checkbox" :checked="isSelected(doc)" @change="handleDocClick(doc)"
                class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 cursor-pointer" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <DescriptionOutlined class="w-4 h-4 text-indigo-500" />
                  <h4 class="font-bold text-sm text-slate-700 truncate">{{ doc.fileName }}</h4>
                </div>
                <p class="text-xs text-slate-400">{{ (doc.content.length / 1000).toFixed(1) }}k 字</p>
              </div>
            </label>
          </div>

          <!-- 底部按钮 -->
          <div class="px-5 py-4 border-t border-slate-100 flex gap-3">
            <button @click="emit('close')"
              class="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              取消
            </button>
            <button @click="emit('close')"
              class="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  @apply w-2;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-slate-100 rounded-lg;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-slate-300 rounded-lg;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
