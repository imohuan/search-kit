import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import type { AppConfig } from "@/types";

/**
 * 默认应用配置
 */
const defaultConfig: AppConfig = {
  previewRange: 30,
  minFontSize: 12,
  maxFontSize: 36,
  maxSearchGap: 30,
  detailRange: 200,
  charGridWidth: 26,
};

/**
 * 应用配置Store
 * 管理全局应用配置，使用localStorage持久化
 */
export const useAppStore = defineStore("app", () => {
  // 使用VueUse的useStorage实现持久化
  const config = useStorage<AppConfig>("app-config", defaultConfig, localStorage, {
    mergeDefaults: true,
  });

  // 设置弹窗状态
  const showSettings = useStorage("show-settings", false);

  /**
   * 更新配置项
   */
  function updateConfig(partial: Partial<AppConfig>) {
    Object.assign(config.value, partial);
  }

  /**
   * 重置配置为默认值
   */
  function resetConfig() {
    Object.assign(config.value, defaultConfig);
  }

  /**
   * 打开设置弹窗
   */
  function openSettings() {
    showSettings.value = true;
  }

  /**
   * 关闭设置弹窗
   */
  function closeSettings() {
    showSettings.value = false;
  }

  return {
    config,
    showSettings,
    updateConfig,
    resetConfig,
    openSettings,
    closeSettings,
  };
});
