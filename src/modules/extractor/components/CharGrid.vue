<script setup lang="ts">
/**
 * 字符网格组件
 * Requirements: 6.4, 6.5
 *
 * 功能:
 * - 显示字符网格，支持连续数字字母合并显示
 * - 使用 inline-block 布局，自然换行
 * - 空格不显示方格，仅保留间距
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.store'
import type { CharCell } from '@/types'

const props = defineProps<{
  charList: CharCell[]
  selectedIndices: Set<number>
  hideSpaces: boolean
  extractedList: Array<{ indices: number[]; color: string }>
}>()

defineEmits<{
  'touchstart': [e: TouchEvent]
  'touchmove': [e: TouchEvent]
  'touchend': []
}>()

const appStore = useAppStore()

// 统一的字符尺寸
const cellSize = computed(() => appStore.config.charGridWidth)

/**
 * 获取CharCell覆盖的所有原始索引
 */
function getCellIndices(cell: CharCell): number[] {
  if (cell.isGrouped && cell.groupText) {
    const indices: number[] = []
    for (let i = 0; i < cell.groupText.length; i++) {
      indices.push(cell.index + i)
    }
    return indices
  }
  return [cell.index]
}

/**
 * 检查单元格是否被选中
 */
function isCellSelected(cell: CharCell): boolean {
  const indices = getCellIndices(cell)
  return indices.every(idx => props.selectedIndices.has(idx))
}

/**
 * 检查字符索引是否在已提取列表中，返回项目索引（-1表示未提取）
 */
function getExtractedItemIndex(charIndex: number): number {
  for (let i = 0; i < props.extractedList.length; i++) {
    const item = props.extractedList[i]
    if (item && item.indices && item.indices.includes(charIndex)) {
      return i
    }
  }
  return -1
}

/**
 * 获取已提取项的颜色
 */
function getExtractedColor(itemIndex: number): string {
  if (itemIndex < 0 || itemIndex >= props.extractedList.length) {
    return '#6366f1'
  }
  const item = props.extractedList[itemIndex]
  return item?.color || '#6366f1'
}

/**
 * 获取已提取字符的样式（带透明度）
 */
function getExtractedStyle(cell: CharCell): Record<string, string> {
  const itemIndex = getExtractedItemIndex(cell.index)
  if (itemIndex === -1) return {}

  const color = getExtractedColor(itemIndex)
  return {
    backgroundColor: color + '33',
    borderColor: color + '66',
    color: color
  }
}

/**
 * 判断是否为空格字符
 */
function isSpace(cell: CharCell): boolean {
  return cell.char === ' '
}

/**
 * 判断是否为换行符
 */
function isNewline(cell: CharCell): boolean {
  return cell.char === '\n'
}

/**
 * 是否显示单元格（空格和换行符特殊处理）
 */
function shouldShowCell(cell: CharCell): boolean {
  // 换行符始终显示（作为换行）
  if (isNewline(cell)) return true
  // 空格：如果隐藏空格则不显示
  if (isSpace(cell) && props.hideSpaces) return false
  return true
}

/**
 * 获取显示的字符文本
 */
function getDisplayText(cell: CharCell): string {
  if (cell.isGrouped && cell.groupText) {
    return cell.groupText
  }
  return cell.char
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3 bg-white scrollbar-hide char-grid">
    <div class="leading-relaxed select-none pb-24" @touchstart.passive="$emit('touchstart', $event)"
      @touchmove.prevent="$emit('touchmove', $event)" @touchend.passive="$emit('touchend')">
      <template v-for="(cell, idx) in charList" :key="idx">
        <!-- 换行符：使用 br 实现真正换行 -->
        <br v-if="isNewline(cell)" />

        <!-- 空格：仅显示间距，不显示方格 -->
        <span v-else-if="isSpace(cell) && shouldShowCell(cell)" class="inline-block w-2" />

        <!-- 普通字符/组合字符 -->
        <span v-else-if="shouldShowCell(cell)" :data-index="cell.index"
          :data-grouped="cell.isGrouped ? 'true' : undefined"
          :data-group-length="cell.isGrouped && cell.groupText ? cell.groupText.length : undefined"
          class="char-cell inline-flex items-center justify-center rounded font-medium cursor-pointer select-none border m-0.5 align-middle relative"
          :class="[
            isCellSelected(cell)
              ? 'bg-indigo-600 border-indigo-600 text-white scale-105 shadow-sm z-10'
              : getExtractedItemIndex(cell.index) !== -1
                ? 'border-slate-200 z-5'
                : 'bg-slate-50 border-slate-100/80 text-slate-600'
          ]" :style="{
            width: cell.isGrouped && cell.groupText
              ? `${cellSize * Math.min(cell.groupText.length, 2.5)}px`
              : `${cellSize}px`,
            height: `${cellSize}px`,
            fontSize: '13px',
            ...(!isCellSelected(cell) && getExtractedItemIndex(cell.index) !== -1 ? getExtractedStyle(cell) : {})
          }">
          {{ getDisplayText(cell) }}

          <!-- 已提取项的序号标注 -->
          <span v-if="!isCellSelected(cell) && getExtractedItemIndex(cell.index) !== -1"
            class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm"
            :style="{
              backgroundColor: getExtractedColor(getExtractedItemIndex(cell.index)),
              color: 'white'
            }">
            {{ extractedList.length - getExtractedItemIndex(cell.index) }}
          </span>
        </span>
      </template>
    </div>
  </div>
</template>
