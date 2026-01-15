/**
 * 搜索状态管理
 * 用于持久化搜索状态，支持从详情页返回时恢复
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { searchService } from "@/services/search.service";
import { useDocumentStore } from "@/stores/document.store";
import { useAppStore } from "@/stores/app.store";
import type { SearchResult, Document } from "@/types";

export const useSearchStore = defineStore("search", () => {
  const documentStore = useDocumentStore();
  const appStore = useAppStore();

  // ============ 搜索状态 ============
  const query = ref("");
  const isExact = useStorage("search-is-exact", false);
  const isSearching = ref(false);
  const results = ref<SearchResult[]>([]);

  // ============ 文档筛选状态 ============
  const selectedDocIds = ref<Set<number>>(new Set());

  // ============ 字体大小状态 ============
  const fontSize = useStorage("search-font-size", 14);

  // ============ 符号过滤状态 ============
  const filterSymbols = useStorage("search-filter-symbols", false);

  // ============ 滚动位置状态 ============
  const scrollTop = ref(0);

  // ============ 计算属性 ============
  const filteredDocuments = computed<Document[]>(() => {
    if (selectedDocIds.value.size === 0) {
      return documentStore.documents;
    }
    return documentStore.documents.filter((doc) => doc.id !== undefined && selectedDocIds.value.has(doc.id));
  });

  const resultCount = computed(() => results.value.length);
  const hasResults = computed(() => results.value.length > 0);

  // ============ 搜索方法 ============
  function performSearch() {
    if (!query.value.trim()) {
      results.value = [];
      return;
    }

    isSearching.value = true;

    try {
      const searchResults = searchService.search(query.value, filteredDocuments.value, {
        maxGap: appStore.config.maxSearchGap,
        isExact: isExact.value,
        previewRange: appStore.config.previewRange,
        filterSymbols: filterSymbols.value,
      });
      results.value = searchResults;
    } finally {
      isSearching.value = false;
    }
  }

  function clearSearch() {
    query.value = "";
    results.value = [];
    scrollTop.value = 0;
  }

  function setQuery(value: string) {
    query.value = value;
  }

  function setScrollTop(value: number) {
    scrollTop.value = value;
  }

  function toggleExactMode() {
    isExact.value = !isExact.value;
    if (query.value.trim()) {
      performSearch();
    }
  }

  function toggleFilterSymbols() {
    filterSymbols.value = !filterSymbols.value;
    if (query.value.trim()) {
      performSearch();
    }
  }

  // ============ 文档筛选方法 ============
  function initDocFilter() {
    selectedDocIds.value = new Set(
      documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
    );
  }

  function toggleDocSelection(docId: number) {
    if (selectedDocIds.value.has(docId)) {
      selectedDocIds.value.delete(docId);
    } else {
      selectedDocIds.value.add(docId);
    }
    if (query.value.trim()) {
      performSearch();
    }
  }

  function selectAllDocs() {
    selectedDocIds.value = new Set(
      documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
    );
    if (query.value.trim()) {
      performSearch();
    }
  }

  function deselectAllDocs() {
    selectedDocIds.value.clear();
    if (query.value.trim()) {
      performSearch();
    }
  }

  return {
    // 状态
    query,
    isExact,
    isSearching,
    results,
    resultCount,
    hasResults,
    fontSize,
    filterSymbols,
    scrollTop,
    selectedDocIds,
    filteredDocuments,

    // 方法
    performSearch,
    clearSearch,
    setQuery,
    setScrollTop,
    toggleExactMode,
    toggleFilterSymbols,
    initDocFilter,
    toggleDocSelection,
    selectAllDocs,
    deselectAllDocs,
  };
});
