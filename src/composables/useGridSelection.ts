/**
 * 网格选择手势 Composable
 * 优化的触摸/鼠标选择逻辑，支持点击和滑动选择
 *
 * 特性:
 * - 支持触摸滑动选择
 * - 支持鼠标点击和拖拽选择
 * - 使用 RAF 节流优化性能
 * - 批量更新减少响应式开销
 */

import { ref, onUnmounted, type Ref } from "vue";

export interface GridSelectionOptions {
  /** 选中索引的 Set */
  selectedIndices: Ref<Set<number>>;
  /** 添加选中索引 */
  addIndex: (index: number) => void;
  /** 移除选中索引 */
  removeIndex: (index: number) => void;
  /** 批量设置选中索引 */
  setIndices?: (indices: Set<number>) => void;
}

export interface GridSelectionReturn {
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>;
  /** 绑定到容器的事件处理器 */
  bindEvents: (container: HTMLElement) => void;
  /** 解绑事件 */
  unbindEvents: () => void;
}

/**
 * 从元素获取选择信息
 */
function getSelectionInfo(el: HTMLElement | null): {
  index: number;
  isGrouped: boolean;
  groupLength: number;
} | null {
  if (!el) return null;

  const indexStr = el.dataset?.index;
  if (indexStr === undefined) return null;

  const index = parseInt(indexStr, 10);
  if (isNaN(index)) return null;

  const isGrouped = el.dataset?.grouped === "true";
  const groupLength = parseInt(el.dataset?.groupLength || "1", 10);

  return { index, isGrouped, groupLength };
}

/**
 * 获取单元格覆盖的所有索引
 */
function getCellIndices(info: { index: number; isGrouped: boolean; groupLength: number }): number[] {
  if (info.isGrouped && info.groupLength > 1) {
    const indices: number[] = [];
    for (let i = 0; i < info.groupLength; i++) {
      indices.push(info.index + i);
    }
    return indices;
  }
  return [info.index];
}

export function useGridSelection(options: GridSelectionOptions): GridSelectionReturn {
  const { selectedIndices, addIndex, removeIndex, setIndices } = options;

  // 状态
  const isDragging = ref(false);
  let dragMode = true; // true = 选择, false = 取消选择
  let lastProcessedIndex: number | null = null;
  let rafId: number | null = null;
  let containerEl: HTMLElement | null = null;
  let isTouchDevice = false; // 标记是否为触摸操作，防止触摸后的模拟鼠标事件

  // 待处理的索引变更（用于批量更新，仅在滑动时使用）
  let pendingChanges: Map<number, boolean> = new Map();

  /**
   * 立即应用单个索引变更
   */
  function applyIndexChange(index: number, shouldSelect: boolean): void {
    if (shouldSelect) {
      addIndex(index);
    } else {
      removeIndex(index);
    }
  }

  /**
   * 批量应用索引变更
   */
  function flushPendingChanges(): void {
    if (pendingChanges.size === 0) return;

    if (setIndices) {
      // 如果支持批量设置，使用批量更新
      const newSet = new Set(selectedIndices.value);
      for (const [index, shouldSelect] of pendingChanges) {
        if (shouldSelect) {
          newSet.add(index);
        } else {
          newSet.delete(index);
        }
      }
      setIndices(newSet);
    } else {
      // 否则逐个更新
      for (const [index, shouldSelect] of pendingChanges) {
        applyIndexChange(index, shouldSelect);
      }
    }

    pendingChanges.clear();
  }

  /**
   * 添加待处理的索引变更（用于滑动时的批量更新）
   */
  function queueIndexChange(index: number, shouldSelect: boolean): void {
    pendingChanges.set(index, shouldSelect);
  }

  /**
   * 立即处理单元格的选择/取消选择
   */
  function processCellImmediate(info: { index: number; isGrouped: boolean; groupLength: number }): void {
    const indices = getCellIndices(info);

    if (setIndices) {
      // 批量更新
      const newSet = new Set(selectedIndices.value);
      for (const idx of indices) {
        if (dragMode) {
          newSet.add(idx);
        } else {
          newSet.delete(idx);
        }
      }
      setIndices(newSet);
    } else {
      // 逐个更新
      for (const idx of indices) {
        applyIndexChange(idx, dragMode);
      }
    }
  }

  /**
   * 队列处理单元格（用于滑动）
   */
  function processCellQueued(info: { index: number; isGrouped: boolean; groupLength: number }): void {
    const indices = getCellIndices(info);
    for (const idx of indices) {
      queueIndexChange(idx, dragMode);
    }
  }

  /**
   * 从坐标获取目标元素
   */
  function getTargetElement(clientX: number, clientY: number): HTMLElement | null {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;

    // 检查是否是字符单元格或其子元素
    if (el.dataset?.index !== undefined) {
      return el;
    }

    // 检查父元素
    const parent = el.closest("[data-index]") as HTMLElement | null;
    return parent;
  }

  /**
   * 处理选择开始（触摸或鼠标按下）
   * 立即应用变更，确保点击响应即时
   */
  function handleSelectionStart(clientX: number, clientY: number): void {
    const el = getTargetElement(clientX, clientY);
    const info = getSelectionInfo(el);

    if (info) {
      isDragging.value = true;
      // 根据当前状态决定是选择还是取消选择
      const indices = getCellIndices(info);
      const isCurrentlySelected = indices.every((idx) => selectedIndices.value.has(idx));
      dragMode = !isCurrentlySelected;

      // 立即应用，确保点击响应即时
      processCellImmediate(info);
      lastProcessedIndex = info.index;
    }
  }

  /**
   * 处理选择移动（触摸移动或鼠标移动）
   * 使用队列批量更新，优化滑动性能
   */
  function handleSelectionMove(clientX: number, clientY: number): void {
    if (!isDragging.value) return;

    const el = getTargetElement(clientX, clientY);
    const info = getSelectionInfo(el);

    if (info && info.index !== lastProcessedIndex) {
      processCellQueued(info);
      lastProcessedIndex = info.index;
    }
  }

  /**
   * 处理选择结束
   */
  function handleSelectionEnd(): void {
    // 刷新待处理的变更
    flushPendingChanges();

    isDragging.value = false;
    lastProcessedIndex = null;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ========== 触摸事件处理 ==========

  function onTouchStart(e: TouchEvent): void {
    // 标记为触摸操作
    isTouchDevice = true;

    const touch = e.touches[0];
    if (!touch) return;
    handleSelectionStart(touch.clientX, touch.clientY);
  }

  function onTouchMove(e: TouchEvent): void {
    if (!isDragging.value) return;

    const touch = e.touches[0];
    if (!touch) return;

    // 阻止默认滚动行为
    e.preventDefault();

    // 使用 RAF 节流
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (isDragging.value) {
        handleSelectionMove(touch.clientX, touch.clientY);
        // 在 RAF 中刷新队列
        flushPendingChanges();
      }
    });
  }

  function onTouchEnd(): void {
    handleSelectionEnd();
    // 延迟重置触摸标记，防止触摸后的模拟鼠标事件
    setTimeout(() => {
      isTouchDevice = false;
    }, 300);
  }

  function onTouchCancel(): void {
    handleSelectionEnd();
    setTimeout(() => {
      isTouchDevice = false;
    }, 300);
  }

  // ========== 鼠标事件处理 ==========

  function onMouseDown(e: MouseEvent): void {
    // 如果是触摸设备触发的模拟鼠标事件，忽略
    if (isTouchDevice) return;

    // 只处理左键
    if (e.button !== 0) return;
    handleSelectionStart(e.clientX, e.clientY);
  }

  function onMouseMove(e: MouseEvent): void {
    // 如果是触摸设备触发的模拟鼠标事件，忽略
    if (isTouchDevice) return;
    if (!isDragging.value) return;

    // 使用 RAF 节流
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (isDragging.value) {
        handleSelectionMove(e.clientX, e.clientY);
        // 在 RAF 中刷新队列
        flushPendingChanges();
      }
    });
  }

  function onMouseUp(): void {
    // 如果是触摸设备触发的模拟鼠标事件，忽略
    if (isTouchDevice) return;
    handleSelectionEnd();
  }

  function onMouseLeave(): void {
    // 如果是触摸设备触发的模拟鼠标事件，忽略
    if (isTouchDevice) return;
    // 鼠标离开容器时结束选择
    if (isDragging.value) {
      handleSelectionEnd();
    }
  }

  // ========== 事件绑定/解绑 ==========

  function bindEvents(container: HTMLElement): void {
    containerEl = container;

    // 触摸事件
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchCancel, { passive: true });

    // 鼠标事件
    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mouseleave", onMouseLeave);
  }

  function unbindEvents(): void {
    if (!containerEl) return;

    containerEl.removeEventListener("touchstart", onTouchStart);
    containerEl.removeEventListener("touchmove", onTouchMove);
    containerEl.removeEventListener("touchend", onTouchEnd);
    containerEl.removeEventListener("touchcancel", onTouchCancel);

    containerEl.removeEventListener("mousedown", onMouseDown);
    containerEl.removeEventListener("mousemove", onMouseMove);
    containerEl.removeEventListener("mouseup", onMouseUp);
    containerEl.removeEventListener("mouseleave", onMouseLeave);

    containerEl = null;
  }

  // 组件卸载时清理
  onUnmounted(() => {
    unbindEvents();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  });

  return {
    isDragging,
    bindEvents,
    unbindEvents,
  };
}
