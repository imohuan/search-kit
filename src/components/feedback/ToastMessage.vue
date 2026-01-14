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
      <div
        v-if="hasToasts"
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-100"
      >
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="bg-slate-800/90 backdrop-blur text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 max-w-[80%] text-center"
            @click="remove(toast.id)"
          >
            <CheckCircleOutlined
              v-if="toast.type === 'success'"
              class="w-[18px] h-[18px] text-green-400 shrink-0"
            />
            <ErrorOutlined
              v-else
              class="w-[18px] h-[18px] text-red-400 shrink-0"
            />
            <span>{{ toast.message }}</span>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
