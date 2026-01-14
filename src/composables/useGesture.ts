import { ref, onMounted, onUnmounted, type Ref } from "vue";
import type { GestureOptions, SwipeDirection } from "@/types";

/**
 * 默认滑动阈值(px)
 */
const DEFAULT_THRESHOLD = 100;

/**
 * 手势处理 Composable
 * 提供触摸滑动检测功能
 */
export function useGesture(elementRef: Ref<HTMLElement | null>, options: GestureOptions = {}) {
  const { threshold = DEFAULT_THRESHOLD, onSwipeRight, onSwipeLeft } = options;

  // 状态
  const isSwiping = ref(false);
  const swipeDistance = ref(0);
  const swipeDirection = ref<SwipeDirection>(null);

  // 触摸起始位置
  let startX = 0;
  let startY = 0;
  let isTracking = false;

  /**
   * 触摸开始
   */
  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    startX = touch.clientX;
    startY = touch.clientY;
    isTracking = true;
    isSwiping.value = false;
    swipeDistance.value = 0;
    swipeDirection.value = null;
  }

  /**
   * 触摸移动
   */
  function handleTouchMove(e: TouchEvent) {
    if (!isTracking) return;

    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // 判断是否为水平滑动（水平位移大于垂直位移）
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping.value = true;
      swipeDistance.value = Math.abs(deltaX);
      swipeDirection.value = deltaX > 0 ? "right" : "left";

      // 阻止默认滚动行为
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    }
  }

  /**
   * 触摸结束
   */
  function handleTouchEnd() {
    if (!isTracking) return;

    // 检查是否达到阈值
    if (swipeDistance.value >= threshold) {
      if (swipeDirection.value === "right" && onSwipeRight) {
        onSwipeRight();
      } else if (swipeDirection.value === "left" && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // 重置状态
    isTracking = false;
    isSwiping.value = false;
    swipeDistance.value = 0;
    swipeDirection.value = null;
  }

  /**
   * 触摸取消
   */
  function handleTouchCancel() {
    isTracking = false;
    isSwiping.value = false;
    swipeDistance.value = 0;
    swipeDirection.value = null;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    const el = elementRef.value;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchCancel, { passive: true });
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
    el.removeEventListener("touchcancel", handleTouchCancel);
  }

  onMounted(() => {
    bindEvents();
  });

  onUnmounted(() => {
    unbindEvents();
  });

  return {
    isSwiping,
    swipeDistance,
    swipeDirection,
  };
}
