<script setup lang="ts">
/**
 * 设置弹窗组件
 * 允许用户配置应用偏好设置
 * Requirements: 7.5
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { CloseOutlined, RestoreOutlined } from '@vicons/material'

const appStore = useAppStore()

// 配置项定义
interface ConfigItem {
  key: keyof typeof appStore.config.value
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const configItems: ConfigItem[] = [
  { key: 'previewRange', label: '预览上下文长度', min: 10, max: 100, step: 5, unit: '字符' },
  { key: 'maxSearchGap', label: '最大搜索间隔', min: 10, max: 100, step: 5, unit: '字符' },
  { key: 'detailRange', label: '详情预览范围', min: 50, max: 500, step: 50, unit: '字符' },
  { key: 'minFontSize', label: '最小字体大小', min: 10, max: 20, step: 1, unit: 'px' },
  { key: 'maxFontSize', label: '最大字体大小', min: 24, max: 48, step: 2, unit: 'px' },
  { key: 'charGridWidth', label: '字符网格宽度', min: 20, max: 40, step: 2, unit: 'px' }
]

// 获取配置值
function getValue(key: keyof typeof appStore.config.value): number {
  return appStore.config[key] as number
}

// 更新配置值
function updateValue(key: keyof typeof appStore.config.value, value: number) {
  appStore.updateConfig({ [key]: value })
}

// 重置配置
function resetConfig() {
  appStore.resetConfig()
}

// 关闭弹窗
function close() {
  appStore.closeSettings()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="appStore.showSettings"
        class="fixed inset-0 z-9999 flex items-center justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="close"
        />
        
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-xl shadow-xl w-[90vw] max-w-[400px] max-h-[80vh] overflow-hidden flex flex-col">
          <!-- 标题栏 -->
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-medium text-gray-900">设置</h3>
            <div class="flex items-center gap-2">
              <!-- 重置按钮 -->
              <button
                class="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                @click="resetConfig"
                title="重置为默认值"
              >
                <RestoreOutlined class="w-5 h-5" />
              </button>
              <!-- 关闭按钮 -->
              <button
                class="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                @click="close"
              >
                <CloseOutlined class="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <!-- 配置项列表 -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              v-for="item in configItems"
              :key="item.key"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-700">{{ item.label }}</label>
                <span class="text-sm font-medium text-blue-600">
                  {{ getValue(item.key) }}{{ item.unit }}
                </span>
              </div>
              <input
                type="range"
                :value="getValue(item.key)"
                :min="item.min"
                :max="item.max"
                :step="item.step"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                @input="updateValue(item.key, Number(($event.target as HTMLInputElement).value))"
              />
              <div class="flex justify-between text-xs text-gray-400">
                <span>{{ item.min }}{{ item.unit }}</span>
                <span>{{ item.max }}{{ item.unit }}</span>
              </div>
            </div>
          </div>
          
          <!-- 底部说明 -->
          <div class="px-4 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
            <p class="text-xs text-gray-500 text-center">
              设置会自动保存到本地存储
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95);
}

.modal-leave-to .relative {
  transform: scale(0.95);
}

/* 滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer shadow-md;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-blue-500 rounded-full cursor-pointer shadow-md border-0;
}
</style>
