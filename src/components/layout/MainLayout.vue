<script setup lang="ts">
/**
 * 主布局组件
 * 包含 NavBar、TabBar 和内容区域
 */
import NavBar from '@/components/layout/NavBar.vue'
import TabBar from '@/components/layout/TabBar.vue'
</script>

<template>
  <div class="main-layout flex flex-col h-full">
    <!-- 顶部导航栏 -->
    <NavBar />

    <!-- 主内容区域 (带keep-alive缓存) -->
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
  </div>
</template>
