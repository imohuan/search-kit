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
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <NavBar />
    
    <!-- 主内容区域 (带keep-alive缓存) -->
    <!-- Requirements: 9.3 - 使用Vue的keep-alive缓存视图组件 -->
    <main class="flex-1 overflow-hidden relative">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </main>
    
    <!-- 底部Tab栏 -->
    <TabBar />
    
    <!-- 全局弹窗组件 -->
    <ToastMessage />
    <ConfirmModal />
    <SettingsModal />
  </div>
</template>

<style scoped>
/* 主内容区域样式 */
main {
  padding-top: 3.5rem; /* NavBar高度 */
  padding-bottom: 3.5rem; /* TabBar高度 */
}
</style>
