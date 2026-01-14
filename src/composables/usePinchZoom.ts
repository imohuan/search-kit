import { ref, onMounted, onUnmounted, type Ref } from "vue";

/**
 * 双指缩放选项
 */
export interface PinchZoomOptions {
  minScale?: number; // 最小缩放值
  maxScale?: number; // 最大缩放值
  step?: number; // 每次缩放的步进值
  onZoom?: (scale: number, direction: "in" | "out") => void; // 缩放回调
}

/**
 * 双指缩放 Composable
 * 提供移动端双指缩放检测功能，用于调整字体大小等场景
 */
export function usePinchZoom(elementRef: Ref<HTMLElement | null>, options: PinchZoomOptions = {}) {
  const { minScale = 12, maxScale = 36, step = 2, onZoom } = options;

  // 状态
  const isPinching = ref(false);
  const currentScale = ref(16); // 当前缩放值

  // 双指触摸状态
  let initialDistance = 0;
  let lastScale = 16;

  /**
   * 计算两个触摸点之间的距离
   */
  function getDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const touch0 = touches[0]!;
    const touch1 = touches[1]!;
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 触摸开始
   */
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      // 双指触摸开始
      isPinching.value = true;
      initialDistance = getDistance(e.touches);
      lastScale = currentScale.value;
      e.preventDefault();
    }
  }

  /**
   * 触摸移动
   */
  function handleTouchMove(e: TouchEvent) {
    if (!isPinching.value || e.touches.length !== 2) return;

    const currentDistance = getDistance(e.touches);
    if (initialDistance === 0) return;

    // 计算缩放比例
    const ratio = currentDistance / initialDistance;

    // 根据比例计算新的缩放值
    // 放大时 ratio > 1，缩小时 ratio < 1
    const delta = (ratio - 1) * step * 2;
    let newScale = lastScale + delta;

    // 限制范围
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    newScale = Math.round(newScale); // 取整

    if (newScale !== currentScale.value) {
      const direction = newScale > currentScale.value ? "in" : "out";
      currentScale.value = newScale;
      onZoom?.(newScale, direction);
    }

    e.preventDefault();
  }

  /**
   * 触摸结束
   */
  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      isPinching.value = false;
      initialDistance = 0;
    }
  }

  /**
   * 设置当前缩放值（外部同步用）
   */
  function setScale(scale: number) {
    currentScale.value = Math.max(minScale, Math.min(maxScale, scale));
    lastScale = currentScale.value;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    const el = elementRef.value;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });
  }

  /**
   * 解绑事件
   */
  function unbindEvents() {
    const el = elementRef.value;
    if (!el) return;

    el.removeEventListener("touchstart", handleTouchStart);
    el.removeEventListener("touchmove", handleTouchMove);
    el.removeEventListener("touchend", handleTouchEnd);
    el.removeEventListener("touchcancel", handleTouchEnd);
  }

  onMounted(() => {
    bindEvents();
  });

  onUnmounted(() => {
    unbindEvents();
  });

  return {
    isPinching,
    currentScale,
    setScale,
  };
}
