<script setup lang="ts">
/**
 * 字符网格组件
 * Requirements: 4.2, 4.3
 *
 * 功能:
 * - 显示字符网格，支持连续数字字母合并显示
 * - 优化触摸性能，避免卡顿
 */
import { useAppStore } from '@/stores/app.store'
import type { CharCell } from '@/types'

const props = defineProps<{
  charList: CharCell[]
  selectedIndices: Set<number>
  hideSpaces: boolean
  extractedList: Array<{ indices: number[]; color: string }>
}>()

const emit = defineEmits<{
  'touchstart': [e: TouchEvent]
  'touchmove': [e: TouchEvent]
  'touchend': []
}>()

const appStore = useAppStore()

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
    if (item.indices && item.indices.includes(charIndex)) {
      return i
    }
  }
  return -1
}

/**
 * 获取已提取项的颜色
 */
function getExtractedColor(itemIndex: number): string {
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
 * 获取单元格的CSS类
 */
function getCellClass(cell: CharCell): string[] {
  const classes = [
    'relative flex items-center justify-center rounded-[3px] font-medium text-sm transition-all border cursor-pointer select-none'
  ]

  // 空格特殊处理
  if (cell.char === ' ') {
    classes.push('w-3')
  }

  const selected = isCellSelected(cell)
  const extractedIdx = getExtractedItemIndex(cell.index)

  if (selected) {
    classes.push('bg-indigo-600 border-indigo-600 text-white z-10 scale-105 shadow-sm')
  } else if (extractedIdx !== -1) {
    classes.push('border-slate-200 z-[5]')
  } else {
    classes.push('bg-slate-50 border-slate-100/80 text-slate-600')
  }

  return classes
}

/**
 * 获取单元格的内联样式
 */
function getCellStyle(cell: CharCell): Record<string, string> {
  const style: Record<string, string> = {}

  // 非空格字符设置固定宽高
  if (cell.char !== ' ') {
    const width = appStore.config.charGridWidth
    // 组合单元格需要更宽
    if (cell.isGrouped && cell.groupText) {
      const charCount = cell.groupText.length
      style.width = `${width * Math.min(charCount, 3) + (charCount > 1 ? 4 : 0)}px`
      style.fontSize = charCount > 3 ? '10px' : '12px'
    } else {
      style.width = `${width}px`
    }
    style.height = `${width}px`
  }

  // 已提取但未选中的样式
  const selected = isCellSelected(cell)
  const extractedIdx = getExtractedItemIndex(cell.index)
  if (!selected && extractedIdx !== -1) {
    Object.assign(style, getExtractedStyle(cell))
  }

  return style
}

/**
 * 是否显示单元格
 */
function shouldShowCell(cell: CharCell): boolean {
  if (props.hideSpaces && cell.char.trim() === '') {
    return false
  }
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
  <div
    class="h-full overflow-y-auto p-2 bg-white scrollbar-hide char-grid"
  >
    <div
      class="flex flex-wrap gap-1 content-start select-none pb-24"
      @touchstart.passive="$emit('touchstart', $event)"
      @touchmove.prevent="$emit('touchmove', $event)"
      @touchend.passive="$emit('touchend')"
    >
      <template v-for="(cell, idx) in charList" :key="idx">
        <!-- 换行符处理 -->
        <div v-if="cell.char === '\n'" class="w-full h-0" />

        <!-- 普通字符/组合字符 -->
        <div
          v-else-if="shouldShowCell(cell)"
          :data-index="cell.index"
          :class="getCellClass(cell)"
          :style="getCellStyle(cell)"
          class="char-cell"
        >
          {{ getDisplayText(cell) }}

          <!-- 已提取项的序号标注 -->
          <span
            v-if="!isCellSelected(cell) && getExtractedItemIndex(cell.index) !== -1 && cell.char !== ' '"
            class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shadow-sm"
            :style="{
              backgroundColor: getExtractedColor(getExtractedItemIndex(cell.index)),
              color: 'white'
            }"
          >
            {{ extractedList.length - getExtractedItemIndex(cell.index) }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
