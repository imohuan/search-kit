<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { computed } from 'vue'
import { CheckCircleOutlined, ErrorOutlined } from '@vicons/material'

const { toasts, remove } = useToast()

const hasToasts = computed(() => toasts.value.length > 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="hasToasts" class="fixed bottom-26 left-1/2 -translate-x-1/2 z-100 pointer-events-none">
        <TransitionGroup name="toast">
          <div v-for="toast in toasts" :key="toast.id"
            class="bg-slate-800/90 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl text-base font-medium flex items-center justify-center gap-2 min-w-[120px] pointer-events-auto cursor-pointer mb-2"
            @click="remove(toast.id)">
            <CheckCircleOutlined v-if="toast.type === 'success' || toast.type === 'info'"
              class="w-5 h-5 text-green-400 shrink-0" />
            <ErrorOutlined v-else class="w-5 h-5 text-red-400 shrink-0" />
            <span class="whitespace-nowrap">{{ toast.message }}</span>
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
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
