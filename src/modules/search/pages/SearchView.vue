<script setup lang="ts">
/**
 * 搜索视图页面
 * Requirements: 2.1-2.9
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearch } from '../composables/useSearch'
import { useDocumentStore } from '@/stores/document.store'
import { useAppStore } from '@/stores/app.store'
import { useDetailStore } from '@/stores/detail.store'
import SearchBar from '../components/SearchBar.vue'
import SearchResults from '../components/SearchResults.vue'
import DocFilterModal from '../components/DocFilterModal.vue'
import SnippetDropdown from '../components/SnippetDropdown.vue'
import type { SearchResult } from '@/types'
import {
  TextFieldsOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  ExpandMoreOutlined,
  RefreshOutlined,
  SpellcheckOutlined
} from '@vicons/material'

const router = useRouter()
const documentStore = useDocumentStore()
const appStore = useAppStore()
const detailStore = useDetailStore()

const {
  // 搜索状态
  query,
  isExact,
  isSearching,
  results,
  fontSize,
  filterSymbols,

  // 文档筛选状态
  selectedDocIds,
  showDocFilter,

  // 提取器分页状态
  extractedItems,
  currentExtractedIndex,
  currentExtractedItem,
  hasExtractedItems,
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

  // 符号过滤方法
  toggleFilterSymbols
} = useSearch()

/**
 * 处理结果点击 - 跳转到详情页
 */
function handleResultClick(result: SearchResult) {
  detailStore.setDetail(result, query.value, isExact.value, '/search')
  router.push({ name: 'detail', params: { id: result.id }, query: { from: 'search' } })
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
      <SearchBar v-model="query" :is-exact="isExact" :is-searching="isSearching"
        :is-filter-active="selectedDocIds.size < documentStore.documentCount" @update:is-exact="isExact = $event"
        @search="performSearch" @clear="clearSearch" @open-filter="openDocFilter" />
    </div>

    <!-- 搜索结果区域 -->
    <SearchResults :results="results" :font-size="fontSize" :is-searching="isSearching" :query="query"
      @result-click="handleResultClick" />

    <!-- 底部辅助栏 (分页 + 字体滑块 + 剪切板) -->
    <div
      class="px-3 py-2 border-t border-slate-100 flex items-center gap-2 bg-white/95 backdrop-blur-sm shrink-0 h-[52px]">
      <!-- 提取项分页控制 -->
      <div v-if="hasExtractedItems"
        class="flex items-center bg-slate-50 rounded-xl border border-slate-100 flex-1 min-w-0 overflow-hidden">
        <button @click="prevExtractedItem"
          class="w-8 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white transition-all active:scale-90"
          :disabled="currentExtractedIndex <= 0">
          <ChevronLeftOutlined class="w-5 h-5" />
        </button>

        <!-- 下拉选择触发器 -->
        <div @click="openSnippetDropdown"
          class="px-2 flex-1 min-w-0 h-9 flex items-center justify-center text-[10px] font-black text-indigo-600 cursor-pointer transition-colors group">
          <span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded-md mr-1.5 scale-90 shrink-0">
            {{ currentExtractedIndex + 1 }}
          </span>
          <span class="truncate">{{ currentExtractedItem?.text || '---' }}</span>
          <ExpandMoreOutlined
            class="w-4 h-4 ml-1 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        <!-- 重新应用按钮 -->
        <button @click="handleUseExtractedItem"
          class="w-8 h-9 flex items-center justify-center text-slate-400 transition-all active:scale-90"
          title="重新应用当前选中内容">
          <RefreshOutlined class="w-4 h-4" />
        </button>

        <button @click="nextExtractedItem"
          class="w-8 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white transition-all active:scale-90"
          :disabled="currentExtractedIndex >= extractedItems.length - 1">
          <ChevronRightOutlined class="w-5 h-5" />
        </button>
      </div>

      <!-- 字体控制 -->
      <div class="flex items-center gap-2 flex-1 min-w-0 bg-slate-50 px-3 h-9 rounded-xl border border-slate-100">
        <TextFieldsOutlined class="w-4 h-4 text-slate-400" />
        <input type="range" v-model.number="fontSize" :min="appStore.config.minFontSize"
          :max="appStore.config.maxFontSize"
          class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
        <TextFieldsOutlined class="w-5 h-5 text-slate-600" />
      </div>

      <!-- 符号过滤开关 -->
      <button @click="toggleFilterSymbols"
        class="w-8 h-9 flex items-center justify-center transition-all active:scale-90"
        :class="filterSymbols ? 'text-indigo-600' : 'text-slate-300'"
        :title="filterSymbols ? '符号过滤已开启（只匹配中英文和数字）' : '符号过滤已关闭'">
        <SpellcheckOutlined class="w-5 h-5" />
      </button>
    </div>

    <!-- 文档筛选弹窗 -->
    <DocFilterModal :visible="showDocFilter" :documents="documentStore.documents" :selected-ids="selectedDocIds"
      @close="closeDocFilter" @toggle="toggleDocSelection" @select-all="selectAllDocs"
      @deselect-all="deselectAllDocs" />

    <!-- 提取项选择弹窗 -->
    <SnippetDropdown :visible="showSnippetDropdown" :items="extractedItems" :current-index="currentExtractedIndex"
      @close="closeSnippetDropdown" @select="goToExtractedItem" />
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
  @apply shrink-0;
}
</style>
