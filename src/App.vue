<script setup lang="ts">
/**
 * 主应用组件
 * 集成路由视图和全局弹窗
 * Requirements: 7.3, 7.4
 */
import { onMounted } from 'vue'
import { useDocumentStore } from '@/stores/document.store'
import ToastMessage from '@/components/feedback/ToastMessage.vue'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import SettingsModal from '@/components/modal/SettingsModal.vue'

// 初始化文档Store
const documentStore = useDocumentStore()

// 应用启动时加载文档
onMounted(async () => {
  await documentStore.loadDocuments()
})
</script>

<template>
  <div class="app-container flex flex-col">
    <!-- 路由视图（第一层：主布局或独立页面） -->
    <router-view />

    <!-- 全局弹窗组件 -->
    <ToastMessage />
    <ConfirmModal />
    <SettingsModal />
  </div>
</template>

<style scoped>
@reference "@/style.css";

/* 主内容区域样式 */
main {
  @apply pt-14 pb-14;
}
</style>
