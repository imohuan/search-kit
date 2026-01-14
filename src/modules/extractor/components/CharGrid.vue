<script setup lang="ts">
/**
 * 字符网格组件
 * Requirements: 6.4, 6.5
 *
 * 功能:
 * - 显示字符网格，支持连续数字字母合并显示
 * - 使用 CSS 变量优化性能，避免重复计算样式
 * - 支持三种预览模式：full（完整）、simple（简洁）、off（关闭）
 * - 支持触摸和鼠标选择（通过外部绑定事件）
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.store'
import type { CharCell } from '@/types'

const props = defineProps<{
  charList: CharCell[]
  selectedIndices: Set<number>
  hideSpaces: boolean
  filterSymbols: boolean
  previewMode: 'full' | 'simple' | 'off'
  extractedList: Array<{ indices: number[]; color: string }>
  /** 绑定选择事件的函数 */
  bindSelectionEvents?: (container: HTMLElement) => void
  /** 解绑选择事件的函数 */
  unbindSelectionEvents?: () => void
}>()

// 网格容器引用
const gridRef = ref<HTMLElement | null>(null)

// 组件挂载时绑定事件
onMounted(() => {
  if (gridRef.value && props.bindSelectionEvents) {
    props.bindSelectionEvents(gridRef.value)
  }
})

// 组件卸载时解绑事件
onUnmounted(() => {
  if (props.unbindSelectionEvents) {
    props.unbindSelectionEvents()
  }
})

const appStore = useAppStore()

// 统一的字符尺寸
const cellSize = computed(() => appStore.config.charGridWidth)

// 生成 CSS 变量样式（用于完整预览模式）
const cssVariables = computed(() => {
  const vars: Record<string, string> = {}

  // 确保为所有可能的索引生成 CSS 变量（最多 40 个）
  for (let i = 0; i < Math.max(props.extractedList.length, 40); i++) {
    const item = props.extractedList[i]
    const color = item?.color || '#6366f1'
    vars[`--ext-bg-${i}`] = color + '33'
    vars[`--ext-border-${i}`] = color + '66'
    vars[`--ext-color-${i}`] = color
  }

  return vars
})

// 预计算：字符索引 -> 提取项索引的映射
const charToExtractedMap = computed(() => {
  const map = new Map<number, number>()
  props.extractedList.forEach((item, idx) => {
    if (item?.indices) {
      for (const charIdx of item.indices) {
        map.set(charIdx, idx)
      }
    }
  })
  return map
})

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
 * 获取字符的提取项索引（-1 表示未提取）
 */
function getExtractedIndex(charIndex: number): number {
  if (props.previewMode === 'off') return -1
  return charToExtractedMap.value.get(charIndex) ?? -1
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
 * 判断是否为符号字符（非中英文、数字、空格、换行）
 */
function isSymbol(cell: CharCell): boolean {
  return !/^[\u4e00-\u9fa5a-zA-Z0-9\s\n]+$/.test(cell.char)
}

/**
 * 是否显示单元格
 */
function shouldShowCell(cell: CharCell): boolean {
  if (isNewline(cell)) return true
  if (isSpace(cell) && props.hideSpaces) return false
  if (isSymbol(cell) && props.filterSymbols) return false
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

/**
 * 获取单元格的 class
 */
function getCellClass(cell: CharCell): string[] {
  const classes: string[] = []
  const extIdx = getExtractedIndex(cell.index)

  if (isCellSelected(cell)) {
    classes.push('cell-selected')
  } else if (extIdx !== -1) {
    if (props.previewMode === 'simple') {
      classes.push('cell-extracted-simple')
    } else {
      // 完整模式：使用 CSS 变量的 class
      classes.push('cell-extracted', `ext-${extIdx}`)
    }
  } else {
    classes.push('cell-default')
  }

  return classes
}
</script>

<template>
  <div ref="gridRef" class="h-full overflow-y-auto p-3 bg-white scrollbar-hide char-grid" :style="cssVariables">
    <div class="leading-relaxed select-none pb-24">
      <template v-for="(cell, idx) in charList" :key="idx">
        <!-- 换行符 -->
        <br v-if="isNewline(cell)" />

        <!-- 空格 -->
        <span v-else-if="isSpace(cell) && shouldShowCell(cell)" class="inline-block w-2" />

        <!-- 普通字符/组合字符 -->
        <span v-else-if="shouldShowCell(cell)" :data-index="cell.index"
          :data-grouped="cell.isGrouped ? 'true' : undefined"
          :data-group-length="cell.isGrouped && cell.groupText ? cell.groupText.length : undefined"
          class="char-cell inline-flex items-center justify-center rounded font-medium cursor-pointer select-none border m-0.5 align-middle relative"
          :class="getCellClass(cell)" :style="{
            minWidth: `${cellSize}px`,
            maxWidth: cell.isGrouped && cell.groupText
              ? `${cellSize * Math.max(cell.groupText.length, 1)}px`
              : `${cellSize}px`,
            width: 'auto',
            paddingLeft: cell.isGrouped ? '4px' : '0',
            paddingRight: cell.isGrouped ? '4px' : '0',
            height: `${cellSize}px`,
            fontSize: '13px'
          }">
          <span class="truncate max-w-full">{{ getDisplayText(cell) }}</span>

          <!-- 序号标注 - 仅完整模式，使用独立定位避免被截断 -->
          <span v-if="previewMode === 'full' && !isCellSelected(cell) && getExtractedIndex(cell.index) !== -1"
            class="extracted-badge" :class="`badge-${getExtractedIndex(cell.index)}`">
            {{ extractedList.length - getExtractedIndex(cell.index) }}
          </span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 选中状态 */
.cell-selected {
  background-color: #4f46e5;
  border-color: #4f46e5;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  z-index: 10;
}

/* 默认状态 */
.cell-default {
  background-color: rgb(248 250 252);
  border-color: rgb(241 245 249 / 0.8);
  color: rgb(71 85 105);
}

/* 简洁预览模式 - 统一淡紫色背景 */
.cell-extracted-simple {
  background-color: rgb(199 210 254 / 0.5);
  border-color: rgb(165 180 252 / 0.6);
  color: #4f46e5;
}

/* 完整预览模式 - 使用 CSS 变量 */
.cell-extracted {
  z-index: 5;
}

/* 为每个提取项生成样式（最多支持 20 个） */
.ext-0 {
  background-color: var(--ext-bg-0);
  border-color: var(--ext-border-0);
  color: var(--ext-color-0);
}

.ext-1 {
  background-color: var(--ext-bg-1);
  border-color: var(--ext-border-1);
  color: var(--ext-color-1);
}

.ext-2 {
  background-color: var(--ext-bg-2);
  border-color: var(--ext-border-2);
  color: var(--ext-color-2);
}

.ext-3 {
  background-color: var(--ext-bg-3);
  border-color: var(--ext-border-3);
  color: var(--ext-color-3);
}

.ext-4 {
  background-color: var(--ext-bg-4);
  border-color: var(--ext-border-4);
  color: var(--ext-color-4);
}

.ext-5 {
  background-color: var(--ext-bg-5);
  border-color: var(--ext-border-5);
  color: var(--ext-color-5);
}

.ext-6 {
  background-color: var(--ext-bg-6);
  border-color: var(--ext-border-6);
  color: var(--ext-color-6);
}

.ext-7 {
  background-color: var(--ext-bg-7);
  border-color: var(--ext-border-7);
  color: var(--ext-color-7);
}

.ext-8 {
  background-color: var(--ext-bg-8);
  border-color: var(--ext-border-8);
  color: var(--ext-color-8);
}

.ext-9 {
  background-color: var(--ext-bg-9);
  border-color: var(--ext-border-9);
  color: var(--ext-color-9);
}

.ext-10 {
  background-color: var(--ext-bg-10);
  border-color: var(--ext-border-10);
  color: var(--ext-color-10);
}

.ext-11 {
  background-color: var(--ext-bg-11);
  border-color: var(--ext-border-11);
  color: var(--ext-color-11);
}

.ext-12 {
  background-color: var(--ext-bg-12);
  border-color: var(--ext-border-12);
  color: var(--ext-color-12);
}

.ext-13 {
  background-color: var(--ext-bg-13);
  border-color: var(--ext-border-13);
  color: var(--ext-color-13);
}

.ext-14 {
  background-color: var(--ext-bg-14);
  border-color: var(--ext-border-14);
  color: var(--ext-color-14);
}

.ext-15 {
  background-color: var(--ext-bg-15);
  border-color: var(--ext-border-15);
  color: var(--ext-color-15);
}

.ext-16 {
  background-color: var(--ext-bg-16);
  border-color: var(--ext-border-16);
  color: var(--ext-color-16);
}

.ext-17 {
  background-color: var(--ext-bg-17);
  border-color: var(--ext-border-17);
  color: var(--ext-color-17);
}

.ext-18 {
  background-color: var(--ext-bg-18);
  border-color: var(--ext-border-18);
  color: var(--ext-color-18);
}

.ext-19 {
  background-color: var(--ext-bg-19);
  border-color: var(--ext-border-19);
  color: var(--ext-color-19);
}

/* 序号标注 */
.extracted-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  color: white;
}

/* 序号标注颜色 */
.badge-0 {
  background-color: var(--ext-color-0);
}

.badge-1 {
  background-color: var(--ext-color-1);
}

.badge-2 {
  background-color: var(--ext-color-2);
}

.badge-3 {
  background-color: var(--ext-color-3);
}

.badge-4 {
  background-color: var(--ext-color-4);
}

.badge-5 {
  background-color: var(--ext-color-5);
}

.badge-6 {
  background-color: var(--ext-color-6);
}

.badge-7 {
  background-color: var(--ext-color-7);
}

.badge-8 {
  background-color: var(--ext-color-8);
}

.badge-9 {
  background-color: var(--ext-color-9);
}

.badge-10 {
  background-color: var(--ext-color-10);
}

.badge-11 {
  background-color: var(--ext-color-11);
}

.badge-12 {
  background-color: var(--ext-color-12);
}

.badge-13 {
  background-color: var(--ext-color-13);
}

.badge-14 {
  background-color: var(--ext-color-14);
}

.badge-15 {
  background-color: var(--ext-color-15);
}

.badge-16 {
  background-color: var(--ext-color-16);
}

.badge-17 {
  background-color: var(--ext-color-17);
}

.badge-18 {
  background-color: var(--ext-color-18);
}

.badge-19 {
  background-color: var(--ext-color-19);
}
</style>
