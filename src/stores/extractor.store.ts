/**
 * 提取器Store - 管理选字提取器状态持久化
 * Requirements: 4.8, 8.3
 */

import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { computed, watch, ref } from "vue";
import type { ExtractorState, ExtractedItem } from "@/types";

/**
 * 颜色调色板 - 用于已提取项的颜色标识
 */
const COLOR_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#d946ef",
  "#f97316",
];

/**
 * 默认提取器状态
 */
const defaultState: ExtractorState = {
  currentStep: "input",
  innerTab: "select",
  rawText: "",
  extractedList: [],
  selectedIndices: [],
  hideSpaces: false,
  previewMode: "full",
  symbolsCleared: false,
};

/**
 * 提取器Store
 * 管理提取器状态的持久化，使用localStorage存储
 */
export const useExtractorStore = defineStore("extractor", () => {
  // 使用VueUse的useStorage实现持久化
  const storageState = useStorage<ExtractorState>("extractor_v2_data", defaultState, localStorage, {
    mergeDefaults: true,
  });

  // 当前步骤: 'input' | 'select'
  const currentStep = computed({
    get: () => storageState.value.currentStep,
    set: (val) => {
      storageState.value.currentStep = val;
    },
  });

  // 内部标签页: 'select' | 'list'
  const innerTab = computed({
    get: () => storageState.value.innerTab,
    set: (val) => {
      storageState.value.innerTab = val;
    },
  });

  // 原始文本
  const rawText = computed({
    get: () => storageState.value.rawText,
    set: (val) => {
      storageState.value.rawText = val;
    },
  });

  // 隐藏空格开关
  const hideSpaces = computed({
    get: () => storageState.value.hideSpaces,
    set: (val) => {
      storageState.value.hideSpaces = val;
    },
  });

  // 预览模式：full（完整）、simple（简洁）、off（关闭）
  const previewMode = computed({
    get: () => storageState.value.previewMode ?? "full",
    set: (val) => {
      storageState.value.previewMode = val;
    },
  });

  // 符号是否已清除
  const symbolsCleared = computed({
    get: () => storageState.value.symbolsCleared ?? false,
    set: (val) => {
      storageState.value.symbolsCleared = val;
    },
  });

  // 已提取列表 - 使用ref以支持响应式数组操作
  const extractedList = ref<ExtractedItem[]>(
    (storageState.value.extractedList || [])
      .map((item, idx) => ({
        ...item,
        text: (item.text || "")
          .split("\n")
          .filter((l) => l.trim())
          .join("\n"),
        indices: Array.isArray(item.indices) ? item.indices : [],
        color: item.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }))
      .filter((item) => item.text && item.text.trim() !== ""),
  );

  // 监听extractedList变化同步回storage
  watch(
    extractedList,
    (newVal) => {
      storageState.value.extractedList = newVal.map((item) => ({
        text: item.text,
        indices: Array.isArray(item.indices) ? item.indices : [],
        color: item.color,
      }));
    },
    { deep: true },
  );

  // 选中的索引集合 - 使用ref<Set>
  const selectedIndicesSet = ref<Set<number>>(new Set(storageState.value.selectedIndices || []));

  // 监听selectedIndices变化同步回storage
  watch(
    selectedIndicesSet,
    (newSet) => {
      storageState.value.selectedIndices = Array.from(newSet);
    },
    { deep: true },
  );

  /**
   * 获取颜色调色板中的颜色
   */
  function getColor(index: number): string {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  }

  /**
   * 添加提取项到列表开头（最新的在前面）
   */
  function addExtractedItem(item: ExtractedItem): void {
    extractedList.value.unshift(item);
  }

  /**
   * 更新指定索引的提取项
   */
  function updateExtractedItem(index: number, item: ExtractedItem): void {
    if (index >= 0 && index < extractedList.value.length) {
      extractedList.value[index] = item;
    }
  }

  /**
   * 删除指定索引的提取项
   */
  function removeExtractedItem(index: number): void {
    if (index >= 0 && index < extractedList.value.length) {
      extractedList.value.splice(index, 1);
    }
  }

  /**
   * 清空所有提取项
   */
  function clearExtractedList(): void {
    extractedList.value = [];
  }

  /**
   * 设置选中索引
   */
  function setSelectedIndices(indices: Set<number>): void {
    selectedIndicesSet.value = new Set(indices);
  }

  /**
   * 添加选中索引
   */
  function addSelectedIndex(index: number): void {
    selectedIndicesSet.value.add(index);
    // 触发响应式更新
    selectedIndicesSet.value = new Set(selectedIndicesSet.value);
  }

  /**
   * 移除选中索引
   */
  function removeSelectedIndex(index: number): void {
    selectedIndicesSet.value.delete(index);
    // 触发响应式更新
    selectedIndicesSet.value = new Set(selectedIndicesSet.value);
  }

  /**
   * 清空选中索引
   */
  function clearSelectedIndices(): void {
    selectedIndicesSet.value = new Set();
  }

  /**
   * 重置为输入模式
   */
  function resetToInput(): void {
    currentStep.value = "input";
    innerTab.value = "select";
    symbolsCleared.value = false;
  }

  /**
   * 进入选字模式
   */
  function enterSelectMode(): void {
    currentStep.value = "select";
    innerTab.value = "select";
  }

  /**
   * 重置所有状态
   */
  function resetAll(): void {
    storageState.value = { ...defaultState };
    extractedList.value = [];
    selectedIndicesSet.value = new Set();
  }

  return {
    // 状态
    currentStep,
    innerTab,
    rawText,
    hideSpaces,
    previewMode,
    symbolsCleared,
    extractedList,
    selectedIndicesSet,

    // 常量
    COLOR_PALETTE,

    // 方法
    getColor,
    addExtractedItem,
    updateExtractedItem,
    removeExtractedItem,
    clearExtractedList,
    setSelectedIndices,
    addSelectedIndex,
    removeSelectedIndex,
    clearSelectedIndices,
    resetToInput,
    enterSelectMode,
    resetAll,
  };
});
