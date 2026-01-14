/**
 * 搜索Composable - 封装搜索逻辑、结果管理、文档筛选
 * Requirements: 2.1, 2.2, 2.7, 2.8
 */

import { ref, computed, watch } from "vue";
import { useDebounceFn, useStorage } from "@vueuse/core";
import { searchService } from "@/services/search.service";
import { useDocumentStore } from "@/stores/document.store";
import { useAppStore } from "@/stores/app.store";
import { useExtractorStore } from "@/stores/extractor.store";
import type { SearchResult, Document, ExtractedItem } from "@/types";

/**
 * 搜索Composable
 * 提供搜索功能、结果管理、文档筛选和提取器分页控制
 */
export function useSearch() {
  const documentStore = useDocumentStore();
  const appStore = useAppStore();
  const extractorStore = useExtractorStore();

  // ============ 搜索状态 ============
  const query = ref("");
  const isExact = useStorage("search-is-exact", false);
  const isSearching = ref(false);
  const results = ref<SearchResult[]>([]);

  // ============ 文档筛选状态 ============
  // 选中的文档ID集合（默认全选）
  const selectedDocIds = ref<Set<number>>(new Set());
  const showDocFilter = ref(false);

  // ============ 提取器分页状态 ============
  // 从 extractorStore 读取提取项列表
  const extractedItems = computed(() => extractorStore.extractedList);
  const currentExtractedIndex = ref(0);
  const showSnippetDropdown = ref(false);

  // ============ 字体大小状态 ============
  const fontSize = useStorage("search-font-size", 14);

  // ============ 计算属性 ============

  // 筛选后的文档列表
  const filteredDocuments = computed<Document[]>(() => {
    if (selectedDocIds.value.size === 0) {
      return documentStore.documents;
    }
    return documentStore.documents.filter((doc) => doc.id !== undefined && selectedDocIds.value.has(doc.id));
  });

  // 搜索结果数量
  const resultCount = computed(() => results.value.length);

  // 是否有搜索结果
  const hasResults = computed(() => results.value.length > 0);

  // 当前选中的提取项
  const currentExtractedItem = computed<ExtractedItem | null>(() => {
    if (extractedItems.value.length === 0) return null;
    // 反转顺序显示（最新的在前）
    const reversedIndex = extractedItems.value.length - 1 - currentExtractedIndex.value;
    return extractedItems.value[reversedIndex] ?? null;
  });

  // 是否有提取项
  const hasExtractedItems = computed(() => extractedItems.value.length > 0);

  // 提取项分页信息
  const extractedPagination = computed(() => ({
    current: currentExtractedIndex.value + 1,
    total: extractedItems.value.length,
  }));

  // ============ 搜索方法 ============

  /**
   * 执行搜索
   */
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
      });
      results.value = searchResults;
    } finally {
      isSearching.value = false;
    }
  }

  /**
   * 防抖搜索（300ms）
   */
  const debouncedSearch = useDebounceFn(performSearch, 300);

  /**
   * 清空搜索
   */
  function clearSearch() {
    query.value = "";
    results.value = [];
  }

  /**
   * 切换精确搜索模式
   */
  function toggleExactMode() {
    isExact.value = !isExact.value;
    if (query.value.trim()) {
      performSearch();
    }
  }

  // ============ 文档筛选方法 ============

  /**
   * 初始化文档筛选（全选）
   */
  function initDocFilter() {
    selectedDocIds.value = new Set(
      documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
    );
  }

  /**
   * 切换文档选中状态
   */
  function toggleDocSelection(docId: number) {
    if (selectedDocIds.value.has(docId)) {
      selectedDocIds.value.delete(docId);
    } else {
      selectedDocIds.value.add(docId);
    }
    // 触发重新搜索
    if (query.value.trim()) {
      performSearch();
    }
  }

  /**
   * 全选文档
   */
  function selectAllDocs() {
    selectedDocIds.value = new Set(
      documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
    );
    if (query.value.trim()) {
      performSearch();
    }
  }

  /**
   * 取消全选
   */
  function deselectAllDocs() {
    selectedDocIds.value.clear();
    if (query.value.trim()) {
      performSearch();
    }
  }

  /**
   * 打开文档筛选弹窗
   */
  function openDocFilter() {
    showDocFilter.value = true;
  }

  /**
   * 关闭文档筛选弹窗
   */
  function closeDocFilter() {
    showDocFilter.value = false;
  }

  /**
   * 检查文档是否被选中
   */
  function isDocSelected(docId: number): boolean {
    return selectedDocIds.value.has(docId);
  }

  // ============ 提取器分页方法 ============

  /**
   * 切换到上一个提取项（反转顺序）
   */
  function prevExtractedItem() {
    if (extractedItems.value.length === 0) return;
    // 反转导航顺序
    if (currentExtractedIndex.value < extractedItems.value.length - 1) {
      currentExtractedIndex.value++;
    }
  }

  /**
   * 切换到下一个提取项（反转顺序）
   */
  function nextExtractedItem() {
    if (extractedItems.value.length === 0) return;
    // 反转导航顺序
    if (currentExtractedIndex.value > 0) {
      currentExtractedIndex.value--;
    }
  }

  /**
   * 跳转到指定提取项
   */
  function goToExtractedItem(index: number) {
    if (index >= 0 && index < extractedItems.value.length) {
      currentExtractedIndex.value = index;
    }
  }

  /**
   * 使用当前提取项作为搜索关键词
   */
  function useExtractedItemAsQuery() {
    if (currentExtractedItem.value) {
      query.value = currentExtractedItem.value.text;
      performSearch();
    }
  }

  /**
   * 打开提取项选择弹窗
   */
  function openSnippetDropdown() {
    showSnippetDropdown.value = true;
  }

  /**
   * 关闭提取项选择弹窗
   */
  function closeSnippetDropdown() {
    showSnippetDropdown.value = false;
  }

  // ============ 字体大小方法 ============

  /**
   * 设置字体大小
   */
  function setFontSize(size: number) {
    const min = appStore.config.minFontSize;
    const max = appStore.config.maxFontSize;
    fontSize.value = Math.max(min, Math.min(max, size));
  }

  // ============ 监听器 ============

  // 监听搜索关键词变化，触发防抖搜索
  watch(query, () => {
    debouncedSearch();
  });

  // 监听文档列表变化，更新筛选状态
  watch(
    () => documentStore.documents,
    () => {
      // 移除已删除文档的选中状态
      const validIds = new Set(
        documentStore.documents.filter((doc) => doc.id !== undefined).map((doc) => doc.id as number),
      );
      for (const id of selectedDocIds.value) {
        if (!validIds.has(id)) {
          selectedDocIds.value.delete(id);
        }
      }
    },
    { deep: true },
  );

  return {
    // 搜索状态
    query,
    isExact,
    isSearching,
    results,
    resultCount,
    hasResults,
    fontSize,

    // 文档筛选状态
    selectedDocIds,
    showDocFilter,
    filteredDocuments,

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
    toggleExactMode,

    // 文档筛选方法
    initDocFilter,
    toggleDocSelection,
    selectAllDocs,
    deselectAllDocs,
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

    // 字体大小方法
    setFontSize,
  };
}
