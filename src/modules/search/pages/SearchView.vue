<script setup lang="ts">
/**
 * 搜索视图页面
 * Requirements: 2.1-2.9
 */
import { onMounted, ref } from 'vue'
import { useSearch } from '../composables/useSearch'
import { useDocumentStore } from '@/stores/document.store'
import { useAppStore } from '@/stores/app.store'
import SearchBar from '../components/SearchBar.vue'
import SearchResults from '../components/SearchResults.vue'
import DocFilterModal from '../components/DocFilterModal.vue'
import SnippetDropdown from '../components/SnippetDropdown.vue'
import DetailModal from '@/components/modal/DetailModal.vue'
import type { SearchResult } from '@/types'
import {
  FilterListOutlined,
  TextFieldsOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  ExpandMoreOutlined
} from '@vicons/material'

const documentStore = useDocumentStore()
const appStore = useAppStore()

const {
  // 搜索状态
  query,
  isExact,
  isSearching,
  results,
  fontSize,
  
  // 文档筛选状态
  selectedDocIds,
  showDocFilter,
  
  // 提取器分页状态
  extractedItems,
  currentExtractedIndex,
  currentExtractedItem,
  hasExtractedItems,
  extractedPagination,
  showSnippetDropdown,
  
  // 搜索方法
  performSearch,
  clearSearch,
  
  // 文档筛选方法
  initDocFilter,
  toggleDocSelection,
  selectAllDocs,
  deselectAllDocs,
  openDocFilter,
  closeDocFilter,
  
  // 提取器分页方法
  prevExtractedItem,
  nextExtractedItem,
  goToExtractedItem,
  useExtractedItemAsQuery,
  openSnippetDropdown,
  closeSnippetDropdown,
  
  // 字体大小方法
  setFontSize
} = useSearch()

// 详情弹窗状态
const showDetail = ref(false)
const selectedResult = ref<SearchResult | null>(null)

/**
 * 处理结果点击
 */
function handleResultClick(result: SearchResult) {
  selectedResult.value = result
  showDetail.value = true
}

/**
 * 关闭详情弹窗
 */
function closeDetail() {
  showDetail.value = false
}

/**
 * 处理使用提取项搜索
 */
function handleUseExtractedItem() {
  useExtractedItemAsQuery()
}

/**
 * 初始化
 */
onMounted(async () => {
  // 加载文档列表
  if (!documentStore.hasDocuments) {
    await documentStore.loadDocuments()
  }
  // 初始化文档筛选（全选）
  initDocFilter()
})
</script>

<template>
  <div class="search-view">
    <!-- 搜索栏区域 -->
    <div class="search-header">
      <SearchBar
        v-model="query"
        :is-exact="isExact"
        :is-searching="isSearching"
        @update:is-exact="isExact = $event"
        @search="performSearch"
        @clear="clearSearch"
      />
      
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 文档筛选按钮 -->
        <button
          class="tool-btn"
          @click="openDocFilter"
          :title="`已选 ${selectedDocIds.size} 个文档`"
        >
          <FilterListOutlined class="w-5 h-5" />
          <span class="badge" v-if="selectedDocIds.size < documentStore.documentCount">
            {{ selectedDocIds.size }}
          </span>
        </button>
        
        <!-- 字体大小调节 -->
        <div class="font-size-control">
          <TextFieldsOutlined class="w-4 h-4 text-gray-400" />
          <input
            type="range"
            class="font-slider"
            :min="appStore.config.minFontSize"
            :max="appStore.config.maxFontSize"
            :value="fontSize"
            @input="setFontSize(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="text-xs text-gray-500 w-6">{{ fontSize }}</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索结果区域 -->
    <SearchResults
      :results="results"
      :font-size="fontSize"
      :is-searching="isSearching"
      :query="query"
      @result-click="handleResultClick"
    />
    
    <!-- 底部提取项分页控制 -->
    <div v-if="hasExtractedItems" class="extractor-pagination">
      <!-- 上一个 -->
      <button
        class="page-btn"
        :disabled="currentExtractedIndex >= extractedItems.length - 1"
        @click="prevExtractedItem"
      >
        <ChevronLeftOutlined class="w-5 h-5" />
      </button>
      
      <!-- 当前提取项 -->
      <button
        class="current-item"
        @click="openSnippetDropdown"
      >
        <span
          v-if="currentExtractedItem"
          class="item-text"
          :style="{ backgroundColor: currentExtractedItem.color }"
        >
          {{ currentExtractedItem.text }}
        </span>
        <ExpandMoreOutlined class="w-4 h-4 text-gray-400" />
      </button>
      
      <!-- 下一个 -->
      <button
        class="page-btn"
        :disabled="currentExtractedIndex <= 0"
        @click="nextExtractedItem"
      >
        <ChevronRightOutlined class="w-5 h-5" />
      </button>
      
      <!-- 使用按钮 -->
      <button
        class="use-btn"
        @click="handleUseExtractedItem"
      >
        搜索
      </button>
      
      <!-- 分页信息 -->
      <span class="page-info">
        {{ extractedPagination.current }}/{{ extractedPagination.total }}
      </span>
    </div>
    
    <!-- 文档筛选弹窗 -->
    <DocFilterModal
      :visible="showDocFilter"
      :documents="documentStore.documents"
      :selected-ids="selectedDocIds"
      @close="closeDocFilter"
      @toggle="toggleDocSelection"
      @select-all="selectAllDocs"
      @deselect-all="deselectAllDocs"
    />
    
    <!-- 提取项选择弹窗 -->
    <SnippetDropdown
      :visible="showSnippetDropdown"
      :items="extractedItems"
      :current-index="currentExtractedIndex"
      @close="closeSnippetDropdown"
      @select="goToExtractedItem"
    />
    
    <!-- 详情弹窗 -->
    <DetailModal
      :visible="showDetail"
      :result="selectedResult"
      :search-keyword="query"
      :is-exact="isExact"
      @close="closeDetail"
      @update:visible="showDetail = $event"
    />
  </div>
</template>

<style scoped>
@reference "@/style.css";

.search-view {
  @apply flex flex-col h-full;
  @apply bg-gray-50;
}

.search-header {
  @apply bg-white px-4 py-3;
  @apply border-b border-gray-100;
  @apply sticky top-12 z-10;
}

.toolbar {
  @apply flex items-center gap-3 mt-3;
}

.tool-btn {
  @apply relative p-2 rounded-lg;
  @apply text-gray-600 bg-gray-100;
  @apply hover:bg-gray-200;
  @apply transition-colors duration-200;
}

.badge {
  @apply absolute -top-1 -right-1;
  @apply w-4 h-4 flex items-center justify-center;
  @apply text-[10px] font-medium text-white;
  @apply bg-blue-500 rounded-full;
}

.font-size-control {
  @apply flex items-center gap-2 flex-1;
}

.font-slider {
  @apply flex-1 h-1 bg-gray-200 rounded-full;
  @apply appearance-none cursor-pointer;
}

.font-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4;
  @apply bg-blue-500 rounded-full;
  @apply cursor-pointer;
}

/* 底部提取项分页 */
.extractor-pagination {
  @apply flex items-center gap-2 px-4 py-3;
  @apply bg-white border-t border-gray-100;
  @apply sticky bottom-14;
}

.page-btn {
  @apply p-1.5 rounded-lg;
  @apply text-gray-600 bg-gray-100;
  @apply hover:bg-gray-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}

.current-item {
  @apply flex-1 flex items-center justify-center gap-1;
  @apply px-3 py-2 rounded-lg;
  @apply bg-gray-100;
  @apply hover:bg-gray-200;
  @apply transition-colors duration-200;
  @apply min-w-0;
}

.item-text {
  @apply px-2 py-0.5 rounded;
  @apply text-sm truncate;
  @apply max-w-[150px];
}

.use-btn {
  @apply px-3 py-1.5 rounded-lg;
  @apply text-sm font-medium text-white;
  @apply bg-blue-500 hover:bg-blue-600;
  @apply transition-colors duration-200;
}

.page-info {
  @apply text-xs text-gray-500;
  @apply w-12 text-center;
}
</style>
