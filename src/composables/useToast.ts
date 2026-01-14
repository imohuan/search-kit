import { ref, readonly } from "vue";
import type { ToastMessage, ToastType } from "@/types";

/**
 * Toast消息队列
 */
const toasts = ref<ToastMessage[]>([]);

/**
 * 消息ID计数器
 */
let toastId = 0;

/**
 * 默认显示时长(ms) - 2秒自动消失
 */
const DEFAULT_DURATION = 2000;

/**
 * Toast服务 Composable
 * 提供全局消息提示功能
 */
export function useToast() {
  /**
   * 显示Toast消息
   */
  function show(message: string, type: ToastType = "info", duration = DEFAULT_DURATION) {
    const id = ++toastId;
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration,
    };
    toasts.value.push(toast);

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * 显示成功消息
   */
  function success(message: string, duration = DEFAULT_DURATION) {
    return show(message, "success", duration);
  }

  /**
   * 显示错误消息
   */
  function error(message: string, duration = DEFAULT_DURATION) {
    return show(message, "error", duration);
  }

  /**
   * 显示信息消息
   */
  function info(message: string, duration = DEFAULT_DURATION) {
    return show(message, "info", duration);
  }

  /**
   * 显示警告消息
   */
  function warning(message: string, duration = DEFAULT_DURATION) {
    return show(message, "warning", duration);
  }

  /**
   * 移除指定Toast
   */
  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  /**
   * 清空所有Toast
   */
  function clear() {
    toasts.value = [];
  }

  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    info,
    warning,
    remove,
    clear,
  };
}
