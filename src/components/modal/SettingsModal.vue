<script setup lang="ts">
/**
 * 设置弹窗组件
 * 允许用户配置应用偏好设置
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
import { useAppStore } from '@/stores/app.store'
import type { AppConfig } from '@/types'

const appStore = useAppStore()

// 获取配置值
function getValue(key: keyof AppConfig): number {
  return appStore.config[key] as number
}

// 更新配置值
function updateValue(key: keyof AppConfig, value: number) {
  appStore.updateConfig({ [key]: value })
}

// 保存并关闭
function save() {
  // 配置已经通过 updateValue 实时更新，这里只需关闭弹窗
  appStore.closeSettings()
}

// 关闭弹窗
function close() {
  appStore.closeSettings()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="appStore.showSettings"
        class="fixed inset-0 z-60 flex items-center justify-center p-4"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="close"
        />
        
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6 z-10">
          <!-- 标题 -->
          <h3 class="text-lg font-bold text-slate-800">偏好设置</h3>
          
          <!-- 配置项列表 -->
          <div class="space-y-4">
            <!-- 列表预览字数 -->
            <div>
              <label class="text-sm font-medium text-slate-600 block mb-2">列表预览字数 (字符)</label>
              <input
                type="number"
                :value="getValue('previewRange')"
                min="10"
                max="1000"
                step="10"
                class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                @input="updateValue('previewRange', Number(($event.target as HTMLInputElement).value))"
              />
            </div>
            
            <!-- 字体范围 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-600 block mb-2">最小字体 (px)</label>
                <input
                  type="number"
                  :value="getValue('minFontSize')"
                  class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500"
                  @input="updateValue('minFontSize', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-slate-600 block mb-2">最大字体 (px)</label>
                <input
                  type="number"
                  :value="getValue('maxFontSize')"
                  class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500"
                  @input="updateValue('maxFontSize', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <!-- 搜索字间距 -->
            <div>
              <label class="text-sm font-medium text-slate-600 block mb-2">搜索字间距最大限制 (字符)</label>
              <p class="text-xs text-slate-400 mb-2">两个关键字之间的距离超过此值将不再匹配。</p>
              <input
                type="number"
                :value="getValue('maxSearchGap')"
                min="1"
                max="500"
                step="1"
                class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                @input="updateValue('maxSearchGap', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <!-- 详情上下文范围 -->
            <div>
              <label class="text-sm font-medium text-slate-600 block mb-2">详情上下文范围 (字符)</label>
              <input
                type="number"
                :value="getValue('detailRange')"
                min="100"
                max="5000"
                step="50"
                class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                @input="updateValue('detailRange', Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <!-- 选字格宽度 -->
            <div>
              <label class="text-sm font-medium text-slate-600 block mb-2">选字格最小宽度 (px)</label>
              <input
                type="number"
                :value="getValue('charGridWidth')"
                min="20"
                max="100"
                step="1"
                class="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm border-none focus:ring-2 focus:ring-indigo-500 transition-all"
                @input="updateValue('charGridWidth', Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="flex justify-end">
            <button
              @click="save"
              class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium active:scale-95 transition-transform"
            >
              保存并生效
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
