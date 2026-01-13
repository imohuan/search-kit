import { ref, readonly } from 'vue'

/**
 * 确认弹窗选项
 */
export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

/**
 * 确认弹窗状态
 */
interface ConfirmState {
  visible: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

/**
 * 默认选项
 */
const defaultOptions: ConfirmOptions = {
  title: '确认',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'info'
}

/**
 * 确认弹窗状态
 */
const state = ref<ConfirmState>({
  visible: false,
  options: { ...defaultOptions },
  resolve: null
})

/**
 * 确认弹窗服务 Composable
 * 提供全局确认弹窗功能
 */
export function useConfirm() {
  /**
   * 显示确认弹窗
   * @returns Promise<boolean> 用户确认返回true，取消返回false
   */
  function confirm(options: ConfirmOptions | string): Promise<boolean> {
    return new Promise((resolve) => {
      const opts = typeof options === 'string'
        ? { ...defaultOptions, message: options }
        : { ...defaultOptions, ...options }

      state.value = {
        visible: true,
        options: opts,
        resolve
      }
    })
  }

  /**
   * 用户确认
   */
  function handleConfirm() {
    if (state.value.resolve) {
      state.value.resolve(true)
    }
    close()
  }

  /**
   * 用户取消
   */
  function handleCancel() {
    if (state.value.resolve) {
      state.value.resolve(false)
    }
    close()
  }

  /**
   * 关闭弹窗
   */
  function close() {
    state.value = {
      visible: false,
      options: { ...defaultOptions },
      resolve: null
    }
  }

  return {
    state: readonly(state),
    confirm,
    handleConfirm,
    handleCancel,
    close
  }
}
