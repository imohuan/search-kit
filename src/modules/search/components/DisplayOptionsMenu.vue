<script setup lang="ts">
/**
 * 搜索结果显示选项菜单
 * 底部弹出式，参考 DocFilterModal 样式
 */
import { TuneOutlined, CloseOutlined, CheckOutlined } from '@vicons/material'

export interface DisplayOptions {
  showTitle: boolean
  showSpan: boolean
  showPosition: boolean
  showDetail: boolean
  compact: boolean // 紧凑模式
}

const props = defineProps<{
  visible: boolean
  options: DisplayOptions
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'update:options': [options: DisplayOptions]
}>()

// 关闭菜单
function close() {
  emit('update:visible', false)
}

// 切换选项
function toggleOption(key: keyof DisplayOptions) {
  emit('update:options', {
    ...props.options,
    [key]: !props.options[key]
  })
}

// 选项配置
const optionItems = [
  { key: 'showTitle' as const, label: '文件名' },
  { key: 'showSpan' as const, label: '跨度标签' },
  { key: 'showPosition' as const, label: '位置信息' },
  { key: 'showDetail' as const, label: '查看详情' },
  { key: 'compact' as const, label: '紧凑模式' }
]
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-end justify-center" @click.self="close">
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-black/50" @click="close" />

        <!-- 弹窗内容 -->
        <div class="bg-white w-full max-w-md rounded-t-3xl shadow-2xl overflow-hidden relative" @click.stop>
          <!-- 标题栏 -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50 to-white">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TuneOutlined class="w-5 h-5 text-indigo-600" />
              显示选项
            </h3>
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="close" aria-label="关闭">
              <CloseOutlined class="w-5 h-5" />
            </button>
          </div>

          <!-- 选项列表 -->
          <div class="px-5 py-3 space-y-2">
            <label v-for="item in optionItems" :key="item.key"
              class="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50 rounded-xl border cursor-pointer transition-all"
              :class="options[item.key] ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100'">
              <input type="checkbox" :checked="options[item.key]" @change="toggleOption(item.key)"
                class="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 cursor-pointer" />
              <span class="flex-1 text-sm font-medium text-slate-700">{{ item.label }}</span>
              <CheckOutlined v-if="options[item.key]" class="w-4 h-4 text-indigo-600" />
            </label>
          </div>

          <!-- 底部按钮 -->
          <div class="px-5 py-4 border-t border-slate-100">
            <button @click="close"
              class="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

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
