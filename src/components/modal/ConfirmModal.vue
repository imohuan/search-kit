<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { computed } from 'vue'
import { WarningAmberOutlined, HelpOutlineOutlined } from '@vicons/material'

const { state, handleConfirm, handleCancel } = useConfirm()

/**
 * 获取图标组件
 */
const iconComponent = computed(() => {
  return state.value.options.type === 'danger' ? WarningAmberOutlined : HelpOutlineOutlined
})

/**
 * 获取图标容器样式
 */
const iconContainerClass = computed(() => {
  const base = 'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-inner transition-colors'
  const typeClasses: Record<string, string> = {
    danger: 'bg-red-50 text-red-500',
    warning: 'bg-yellow-50 text-yellow-500',
    info: 'bg-indigo-50 text-indigo-600'
  }
  return `${base} ${typeClasses[state.value.options.type || 'info']}`
})

/**
 * 获取确认按钮样式
 */
const confirmButtonClass = computed(() => {
  const base = 'flex-1 py-3.5 text-sm font-bold rounded-2xl transition-all shadow-lg active:scale-95 text-white'
  const typeClasses: Record<string, string> = {
    danger: 'bg-red-500 shadow-red-200',
    warning: 'bg-yellow-500 shadow-yellow-200',
    info: 'bg-indigo-600 shadow-indigo-200'
  }
  return `${base} ${typeClasses[state.value.options.type || 'info']}`
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="state.visible"
        class="fixed inset-0 z-200 flex items-center justify-center p-4"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          @click="handleCancel"
        />
        
        <!-- 弹窗内容 -->
        <div class="bg-white rounded-4xl w-full max-w-[320px] overflow-hidden relative shadow-2xl z-20 transform transition-all">
          <!-- 内容区 -->
          <div class="p-8 text-center">
            <!-- 图标容器 -->
            <div :class="iconContainerClass">
              <component :is="iconComponent" class="text-3xl" />
            </div>
            
            <!-- 标题 -->
            <h3 class="text-xl font-black text-slate-800 mb-2">
              {{ state.options.title }}
            </h3>
            
            <!-- 消息 -->
            <p class="text-sm text-slate-500 leading-relaxed">
              {{ state.options.message }}
            </p>
          </div>
          
          <!-- 按钮区 -->
          <div class="flex p-4 gap-3 bg-slate-50/50">
            <button
              class="flex-1 py-3.5 text-sm font-bold text-slate-400 bg-white hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 active:scale-95"
              @click="handleCancel"
            >
              {{ state.options.cancelText }}
            </button>
            <button
              :class="confirmButtonClass"
              @click="handleConfirm"
            >
              {{ state.options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .relative,
.fade-leave-active .relative {
  transition: transform 0.2s ease;
}

.fade-enter-from .relative {
  transform: scale(0.95);
}

.fade-leave-to .relative {
  transform: scale(0.95);
}
</style>
