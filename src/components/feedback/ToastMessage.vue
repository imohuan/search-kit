<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { computed } from 'vue'

const { toasts, remove } = useToast()

/**
 * 获取Toast样式类
 */
function getToastClass(type: string) {
  const baseClass = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px] max-w-[80vw]'
  const typeClasses: Record<string, string> = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  }
  return `${baseClass} ${typeClasses[type] || typeClasses.info}`
}

/**
 * 获取图标
 */
function getIcon(type: string) {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }
  return icons[type] || icons.info
}

const hasToasts = computed(() => toasts.value.length > 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-container">
      <div
        v-if="hasToasts"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-2"
      >
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="getToastClass(toast.type)"
            @click="remove(toast.id)"
          >
            <span class="text-lg">{{ getIcon(toast.type) }}</span>
            <span class="flex-1">{{ toast.message }}</span>
          </div>
        </TransitionGroup>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-container-enter-active,
.toast-container-leave-active {
  transition: opacity 0.2s ease;
}

.toast-container-enter-from,
.toast-container-leave-to {
  opacity: 0;
}
</style>
