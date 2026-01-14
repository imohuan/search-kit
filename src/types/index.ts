/**
 * 文档智搜 Pro - 类型定义
 */

// ============ Document Types ============

/**
 * 文档模型
 */
export interface Document {
  id?: number;
  fileName: string;
  content: string; // 纯文本内容
  htmlContent: string; // HTML格式内容
  date: Date;
  hasOriginalStyles?: boolean; // 是否包含原始样式信息
}

// ============ Search Types ============

/**
 * 搜索结果模型
 */
export interface SearchResult {
  id: number;
  fileName: string;
  content: string;
  matchIndex: number; // 匹配起始位置
  matchLength: number; // 匹配跨度长度
  highlightedSnippet: string;
}

/**
 * 匹配信息
 */
export interface MatchInfo {
  index: number;
  length: number;
  positions: number[];
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  maxGap: number;
  isExact: boolean;
  previewRange: number;
}

// ============ Extractor Types ============

/**
 * 提取项模型
 */
export interface ExtractedItem {
  text: string;
  indices: number[];
  color: string;
}

/**
 * 字符单元格模型
 */
export interface CharCell {
  char: string;
  index: number;
  isGrouped: boolean; // 是否为连续数字/字母组
  groupText?: string; // 组合后的文本
}

/**
 * 提取器状态模型
 */
export interface ExtractorState {
  currentStep: "input" | "select";
  innerTab: "select" | "list";
  rawText: string;
  extractedList: ExtractedItem[];
  selectedIndices: number[];
  hideSpaces: boolean;
}

// ============ App Config Types ============

/**
 * 应用配置模型
 */
export interface AppConfig {
  previewRange: number; // 预览上下文长度，默认30
  minFontSize: number; // 最小字体，默认12
  maxFontSize: number; // 最大字体，默认36
  maxSearchGap: number; // 最大搜索间隔，默认30
  detailRange: number; // 详情预览范围，默认200
  charGridWidth: number; // 字符网格宽度，默认26
}

// ============ File Parser Types ============

/**
 * 文件解析结果
 */
export interface ParseResult {
  text: string;
  html: string;
  hasOriginalStyles?: boolean; // 是否包含原始样式信息
}

// ============ Gesture Types ============

/**
 * 手势选项
 */
export interface GestureOptions {
  threshold?: number; // 触发阈值，默认100px
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

/**
 * 滑动方向
 */
export type SwipeDirection = "left" | "right" | null;

// ============ Toast Types ============

/**
 * Toast消息类型
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Toast消息
 */
export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

// ============ Route Types ============

/**
 * 路由名称
 */
export type RouteName = "search" | "library" | "extractor";
