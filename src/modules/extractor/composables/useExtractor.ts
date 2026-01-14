/**
 * 选字提取器Composable
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 *
 * 功能:
 * - 字符列表生成（连续数字字母合并）
 * - 触摸选择逻辑（优化卡顿）
 * - 提取、编辑、删除操作
 * - 列表顺序反转（最新在前）
 */

import { computed, ref, watch } from "vue";
import { useClipboard } from "@vueuse/core";
import { useExtractorStore } from "@/stores/extractor.store";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import type { CharCell, ExtractedItem } from "@/types";

/**
 * 检查字符是否为连续组的一部分（数字或字母）
 */
function isGroupableChar(char: string): boolean {
  return /^[a-zA-Z0-9]$/.test(char);
}

/**
 * 生成字符单元格列表
 * 连续的数字或字母会被合并为一个单元格
 * Requirements: 4.2
 */
export function generateCharList(text: string): CharCell[] {
  if (!text) return [];

  const result: CharCell[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // 检查是否为可组合字符（数字或字母）
    if (isGroupableChar(char)) {
      // 收集连续的数字或字母
      let groupText = char;
      const startIndex = i;
      i++;

      while (i < text.length && isGroupableChar(text[i])) {
        groupText += text[i];
        i++;
      }

      // 如果组长度大于1，创建组合单元格
      if (groupText.length > 1) {
        result.push({
          char: groupText,
          index: startIndex,
          isGrouped: true,
          groupText,
        });
      } else {
        // 单个字符不组合
        result.push({
          char,
          index: startIndex,
          isGrouped: false,
        });
      }
    } else {
      // 非可组合字符，直接添加
      result.push({
        char,
        index: i,
        isGrouped: false,
      });
      i++;
    }
  }

  return result;
}

/**
 * 获取CharCell覆盖的所有原始索引
 */
export function getCellIndices(cell: CharCell): number[] {
  if (cell.isGrouped && cell.groupText) {
    const indices: number[] = [];
    for (let i = 0; i < cell.groupText.length; i++) {
      indices.push(cell.index + i);
    }
    return indices;
  }
  return [cell.index];
}

export function useExtractor() {
  const store = useExtractorStore();
  const { show: showToast } = useToast();
  const { confirm: showConfirm } = useConfirm();
  const { text: clipboardText, copy: copyToClipboard } = useClipboard();

  // 编辑中的项目索引，-1表示新建模式
  const editingIndex = ref(-1);

  // 拖拽状态
  const isDragging = ref(false);
  const dragMode = ref(true); // true = 选择, false = 取消选择

  // 上一次触摸的索引，用于优化触摸性能
  const lastTouchedIndex = ref<number | null>(null);

  // 字符列表（带连续数字字母合并）
  const charList = computed<CharCell[]>(() => {
    return generateCharList(store.rawText);
  });

  // 简单字符列表（不合并，用于索引映射）
  const simpleCharList = computed<string[]>(() => {
    return (store.rawText || "").split("");
  });

  /**
   * 切换索引的选中状态
   * Requirements: 4.3
   */
  function toggleIndex(index: number, mode: boolean): void {
    if (mode) {
      store.addSelectedIndex(index);
    } else {
      store.removeSelectedIndex(index);
    }
  }

  /**
   * 切换单元格的选中状态（处理组合单元格）
   */
  function toggleCell(cell: CharCell, mode: boolean): void {
    const indices = getCellIndices(cell);
    indices.forEach((idx) => toggleIndex(idx, mode));
  }

  /**
   * 检查单元格是否被选中
   */
  function isCellSelected(cell: CharCell): boolean {
    const indices = getCellIndices(cell);
    return indices.every((idx) => store.selectedIndicesSet.has(idx));
  }

  /**
   * 检查单元格是否部分被选中
   */
  function isCellPartiallySelected(cell: CharCell): boolean {
    const indices = getCellIndices(cell);
    const selectedCount = indices.filter((idx) => store.selectedIndicesSet.has(idx)).length;
    return selectedCount > 0 && selectedCount < indices.length;
  }

  /**
   * 进入选字模式
   * Requirements: 4.1
   */
  function initSelection(): void {
    if (!store.rawText || !store.rawText.trim()) return;
    store.enterSelectMode();
  }

  /**
   * 执行提取或更新操作
   * Requirements: 4.4
   */
  function handleAction(): void {
    if (store.selectedIndicesSet.size === 0) return;

    const indices = Array.from(store.selectedIndicesSet).sort((a, b) => a - b);
    let text = indices.map((i) => simpleCharList.value[i]).join("");

    // 保留换行，只去除空白行
    text = text
      .split("\n")
      .filter((l) => l.trim())
      .join("\n");

    if (!text.trim()) {
      showToast("无法提取空白内容", "error");
      return;
    }

    const newItem: ExtractedItem = {
      text,
      indices: Array.from(store.selectedIndicesSet),
      color:
        editingIndex.value === -1
          ? store.getColor(store.extractedList.length)
          : store.extractedList[editingIndex.value].color,
    };

    if (editingIndex.value === -1) {
      // 新建模式：添加到列表开头（最新在前）
      // Requirements: 4.5
      store.addExtractedItem(newItem);
      showToast("已提取");
    } else {
      // 编辑模式：更新现有项
      store.updateExtractedItem(editingIndex.value, newItem);
      editingIndex.value = -1;
      showToast("已更新");
    }

    store.clearSelectedIndices();
  }

  /**
   * 编辑指定项目
   */
  function editItem(index: number): void {
    editingIndex.value = index;
    const item = store.extractedList[index];
    store.setSelectedIndices(new Set(item.indices));
    store.innerTab = "select";
  }

  /**
   * 删除指定项目
   */
  function removeItem(index: number): void {
    store.removeExtractedItem(index);
    if (editingIndex.value === index) {
      editingIndex.value = -1;
      store.clearSelectedIndices();
    }
    showToast("已删除");
  }

  /**
   * 复制项目文本到剪切板
   */
  function copyItem(text: string): void {
    copyToClipboard(text);
    showToast("已复制到剪切板");
  }

  /**
   * 触摸开始处理
   * Requirements: 4.3 - 优化触摸性能
   */
  function onGridTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const indexStr = el?.dataset?.index;

    if (indexStr !== undefined) {
      const index = parseInt(indexStr, 10);
      if (!isNaN(index)) {
        isDragging.value = true;
        // 根据当前状态决定是选择还是取消选择
        dragMode.value = !store.selectedIndicesSet.has(index);
        toggleIndex(index, dragMode.value);
        lastTouchedIndex.value = index;
      }
    }
  }

  /**
   * 触摸移动处理
   * Requirements: 4.3 - 优化触摸性能，避免重复处理同一索引
   */
  function onGridTouchMove(e: TouchEvent): void {
    if (!isDragging.value) return;

    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const indexStr = el?.dataset?.index;

    if (indexStr !== undefined) {
      const index = parseInt(indexStr, 10);
      // 只有当索引变化时才处理，避免重复操作导致卡顿
      if (!isNaN(index) && index !== lastTouchedIndex.value) {
        toggleIndex(index, dragMode.value);
        lastTouchedIndex.value = index;
      }
    }
  }

  /**
   * 触摸结束处理
   */
  function onGridTouchEnd(): void {
    isDragging.value = false;
    lastTouchedIndex.value = null;
  }

  /**
   * 从剪切板粘贴文本
   */
  async function pasteFromClipboard(): Promise<void> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const content = await navigator.clipboard.readText();
        if (content) {
          store.rawText = content;
          showToast("已从剪切板写入");
          return;
        }
      }

      if (clipboardText.value) {
        store.rawText = clipboardText.value;
        showToast("已从剪切板写入");
      } else {
        throw new Error("Clipboard extraction failed");
      }
    } catch {
      showToast("环境限制(非HTTPS)，请手动粘贴", "error");
    }
  }

  /**
   * 清除符号（保留汉字、字母、数字和空格）
   */
  function clearSymbols(): void {
    const oldText = store.rawText;
    store.rawText = store.rawText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, "");
    if (oldText !== store.rawText) {
      store.clearSelectedIndices();
      showToast("已清除符号");
    }
  }

  /**
   * 全选
   * Requirements: 4.7
   */
  function selectAll(): void {
    const newSet = new Set<number>();
    simpleCharList.value.forEach((char, index) => {
      if (!store.hideSpaces || char.trim() !== "") {
        newSet.add(index);
      }
    });
    store.setSelectedIndices(newSet);
  }

  /**
   * 反选
   * Requirements: 4.7
   */
  function invertSelection(): void {
    const newSet = new Set<number>();
    simpleCharList.value.forEach((char, index) => {
      if (!store.hideSpaces || char.trim() !== "") {
        if (!store.selectedIndicesSet.has(index)) {
          newSet.add(index);
        }
      }
    });
    store.setSelectedIndices(newSet);
  }

  /**
   * 清空所有提取结果
   */
  async function clearAllResults(): Promise<void> {
    if (store.extractedList.length === 0) return;

    const ok = await showConfirm({
      title: "清空结果",
      message: "确定要清空所有的提取结果吗？",
      confirmText: "立即清空",
      type: "danger",
    });

    if (ok) {
      store.clearExtractedList();
      editingIndex.value = -1;
      store.clearSelectedIndices();
      showToast("已清空所有结果");
    }
  }

  /**
   * 获取已提取项的颜色
   */
  function getExtractedColor(itemIndex: number): string {
    const item = store.extractedList[itemIndex];
    return item?.color || store.getColor(itemIndex);
  }

  /**
   * 检查字符索引是否在已提取列表中，返回项目索引（-1表示未提取）
   */
  function getExtractedItemIndex(charIndex: number): number {
    for (let i = 0; i < store.extractedList.length; i++) {
      const item = store.extractedList[i];
      if (item.indices && item.indices.includes(charIndex)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 获取已提取字符的样式（带透明度）
   */
  function getExtractedStyle(charIndex: number): Record<string, string> {
    const itemIndex = getExtractedItemIndex(charIndex);
    if (itemIndex === -1) return {};

    const color = getExtractedColor(itemIndex);
    return {
      backgroundColor: color + "33", // 20%透明度
      borderColor: color + "66", // 40%透明度
      color: color,
    };
  }

  /**
   * 返回输入模式
   */
  function backToInput(): void {
    store.resetToInput();
  }

  /**
   * 获取显示的提取列表（反转顺序，最新在前）
   * Requirements: 4.5
   */
  const displayExtractedList = computed(() => {
    return store.extractedList;
  });

  /**
   * 获取导航用的提取列表（反转顺序以匹配显示）
   * Requirements: 4.6
   */
  function getNavigationIndex(displayIndex: number): number {
    // 显示顺序已经是最新在前，直接返回
    return displayIndex;
  }

  return {
    // 状态
    currentStep: computed(() => store.currentStep),
    innerTab: computed({
      get: () => store.innerTab,
      set: (val) => {
        store.innerTab = val;
      },
    }),
    rawText: computed({
      get: () => store.rawText,
      set: (val) => {
        store.rawText = val;
      },
    }),
    hideSpaces: computed({
      get: () => store.hideSpaces,
      set: (val) => {
        store.hideSpaces = val;
      },
    }),
    charList,
    simpleCharList,
    extractedList: computed(() => store.extractedList),
    displayExtractedList,
    selectedIndices: computed(() => store.selectedIndicesSet),
    editingIndex,
    isDragging,

    // 方法
    initSelection,
    handleAction,
    editItem,
    removeItem,
    copyItem,
    toggleIndex,
    toggleCell,
    isCellSelected,
    isCellPartiallySelected,
    onGridTouchStart,
    onGridTouchMove,
    onGridTouchEnd,
    pasteFromClipboard,
    clearSymbols,
    selectAll,
    invertSelection,
    clearAllResults,
    getExtractedItemIndex,
    getExtractedStyle,
    getExtractedColor,
    backToInput,
    getNavigationIndex,
    getCellIndices,
  };
}
