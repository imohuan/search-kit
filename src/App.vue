<script setup lang="ts">
/**
 * 主应用组件
 * 集成 NavBar, TabBar, 路由视图和全局弹窗
 * Requirements: 7.3, 7.4
 */
import { onMounted } from 'vue'
import { useDocumentStore } from '@/stores/document.store'
import NavBar from '@/components/layout/NavBar.vue'
import TabBar from '@/components/layout/TabBar.vue'
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
    <!-- 顶部导航栏 -->
    <NavBar />

    <!-- 主内容区域 (带keep-alive缓存) -->
    <!-- Requirements: 9.3 - 使用Vue的keep-alive缓存视图组件 -->
    <div class="flex-1 h-full overflow-hidden relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>

    <!-- 底部Tab栏 -->
    <TabBar />

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
