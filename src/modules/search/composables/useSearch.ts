/**
 * 搜索Composable - 封装搜索逻辑、结果管理、文档筛选
 * Requirements: 2.1, 2.2, 2.7, 2.8
 */

import { ref, computed, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useSearchStore } from "@/stores/search.store";
import { useDocumentStore } from "@/stores/document.store";
import { useExtractorStore } from "@/stores/extractor.store";
import { useAppStore } from "@/stores/app.store";
import type { ExtractedItem } from "@/types";

/**
 * 搜索Composable
 * 提供搜索功能、结果管理、文档筛选和提取器分页控制
 */
export function useSearch() {
  const appStore = useAppStore();
  const searchStore = useSearchStore();
  const documentStore = useDocumentStore();
  const extractorStore = useExtractorStore();

  // ============ 文档筛选弹窗状态（本地） ============
  const showDocFilter = ref(false);

  // ============ 提取器分页状态（本地） ============
  const extractedItems = computed(() => extractorStore.extractedList);
  const currentExtractedIndex = ref(0);
  const showSnippetDropdown = ref(false);

  // ============ 计算属性 ============
  const currentExtractedItem = computed<ExtractedItem | null>(() => {
    if (extractedItems.value.length === 0) return null;
    return extractedItems.value[currentExtractedIndex.value] ?? null;
  });

  const hasExtractedItems = computed(() => extractedItems.value.length > 0);

  const extractedPagination = computed(() => ({
    current: currentExtractedIndex.value + 1,
    total: extractedItems.value.length,
  }));

  // ============ 防抖搜索 ============
  const debouncedSearch = useDebounceFn(() => {
    searchStore.performSearch();
  }, 300);

  // ============ 文档筛选方法 ============
  function openDocFilter() {
    showDocFilter.value = true;
  }

  function closeDocFilter() {
    showDocFilter.value = false;
  }

  function isDocSelected(docId: number): boolean {
    return searchStore.selectedDocIds.has(docId);
  }

  // ============ 提取器分页方法 ============
  function prevExtractedItem() {
    if (extractedItems.value.length === 0) return;
    if (currentExtractedIndex.value > 0) {
      currentExtractedIndex.value--;
      if (currentExtractedItem.value) {
        searchStore.setQuery(currentExtractedItem.value.text);
        searchStore.performSearch();
      }
    }
  }

  function nextExtractedItem() {
    if (extractedItems.value.length === 0) return;
    if (currentExtractedIndex.value < extractedItems.value.length - 1) {
      currentExtractedIndex.value++;
      if (currentExtractedItem.value) {
        searchStore.setQuery(currentExtractedItem.value.text);
        searchStore.performSearch();
      }
    }
  }

  function goToExtractedItem(index: number) {
    if (index >= 0 && index < extractedItems.value.length) {
      currentExtractedIndex.value = index;
      if (currentExtractedItem.value) {
        searchStore.setQuery(currentExtractedItem.value.text);
        searchStore.performSearch();
      }
    }
  }

  function useExtractedItemAsQuery() {
    if (currentExtractedItem.value) {
      searchStore.setQuery(currentExtractedItem.value.text);
      searchStore.performSearch();
    }
  }

  function openSnippetDropdown() {
    showSnippetDropdown.value = true;
  }

  function closeSnippetDropdown() {
    showSnippetDropdown.value = false;
  }

  // ============ 监听器 ============
  // 监听搜索关键词变化，触发防抖搜索
  watch(
    () => searchStore.query,
    () => {
      debouncedSearch();
    },
  );

  // 监听精确模式变化，立即重新搜索
  watch(
    () => searchStore.isExact,
    () => {
      if (searchStore.query.trim()) {
        searchStore.performSearch();
      }
    },
  );

  // 监听偏好设置变化，立即重新搜索（previewRange 和 maxSearchGap 会影响搜索结果）
  watch(
    () => [appStore.config.previewRange, appStore.config.maxSearchGap],
    () => {
      if (searchStore.query.trim()) {
        searchStore.performSearch();
      }
    },
  );

  // 监听文档列表变化，更新筛选状态
  watch(
    () => documentStore.documents,
    () => {
      const validIds = new Set(
        documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
      );
      for (const id of searchStore.selectedDocIds) {
        if (!validIds.has(id)) {
          searchStore.selectedDocIds.delete(id);
        }
      }
    },
    { deep: true },
  );

  return {
    // 从 store 导出的状态（响应式）
    query: computed({
      get: () => searchStore.query,
      set: (val) => searchStore.setQuery(val),
    }),
    isExact: computed({
      get: () => searchStore.isExact,
      set: (val) => {
        searchStore.isExact = val;
      },
    }),
    isSearching: computed(() => searchStore.isSearching),
    results: computed(() => searchStore.results),
    resultCount: computed(() => searchStore.resultCount),
    hasResults: computed(() => searchStore.hasResults),
    fontSize: computed({
      get: () => searchStore.fontSize,
      set: (val) => {
        searchStore.fontSize = val;
      },
    }),
    filterSymbols: computed({
      get: () => searchStore.filterSymbols,
      set: (val) => {
        searchStore.filterSymbols = val;
      },
    }),

    // 文档筛选状态
    selectedDocIds: computed(() => searchStore.selectedDocIds),
    showDocFilter,
    filteredDocuments: computed(() => searchStore.filteredDocuments),

    // 提取器分页状态
    extractedItems,
    currentExtractedIndex,
    currentExtractedItem,
    hasExtractedItems,
    extractedPagination,
    showSnippetDropdown,

    // 搜索方法
    performSearch: () => searchStore.performSearch(),
    clearSearch: () => searchStore.clearSearch(),
    toggleExactMode: () => searchStore.toggleExactMode(),

    // 文档筛选方法
    initDocFilter: () => searchStore.initDocFilter(),
    toggleDocSelection: (id: number) => searchStore.toggleDocSelection(id),
    selectAllDocs: () => searchStore.selectAllDocs(),
    deselectAllDocs: () => searchStore.deselectAllDocs(),
    openDocFilter,
    closeDocFilter,
    isDocSelected,

    // 提取器分页方法
    prevExtractedItem,
    nextExtractedItem,
    goToExtractedItem,
    useExtractedItemAsQuery,
    openSnippetDropdown,
    closeSnippetDropdown,

    // 符号过滤方法
    toggleFilterSymbols: () => searchStore.toggleFilterSymbols(),
  };
}
