<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { computed } from 'vue'

const { state, handleConfirm, handleCancel } = useConfirm()

/**
 * 获取确认按钮样式
 */
const confirmButtonClass = computed(() => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors'
  const typeClasses: Record<string, string> = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white'
  }
  return `${base} ${typeClasses[state.value.options.type || 'info']}`
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="state.visible"
        class="fixed inset-0 z-9999 flex items-center justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleCancel"
        />
        
        <!-- 弹窗内容 -->
        <div class="relative bg-white rounded-xl shadow-xl w-[80vw] max-w-[320px] overflow-hidden">
          <!-- 标题 -->
          <div class="px-4 py-3 border-b border-gray-100">
            <h3 class="text-lg font-medium text-gray-900">
              {{ state.options.title }}
            </h3>
          </div>
          
          <!-- 内容 -->
          <div class="px-4 py-4">
            <p class="text-gray-600 text-sm leading-relaxed">
              {{ state.options.message }}
            </p>
          </div>
          
          <!-- 按钮 -->
          <div class="px-4 py-3 flex gap-3 justify-end border-t border-gray-100">
            <button
              class="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
</style>
