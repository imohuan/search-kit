<script setup lang="ts">
/**
 * 详情弹窗组件
 * 显示搜索结果的详细内容，支持全文/片段模式切换、关键词高亮
 * 使用 matchPositions 精确定位，确保与列表高亮一致
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { useAppStore } from '@/stores/app.store'
import { useDocumentStore } from '@/stores/document.store'
import { useGesture } from '@/composables/useGesture'
import { usePinchZoom } from '@/composables/usePinchZoom'
import type { SearchResult, Document } from '@/types'
import {
  KeyboardArrowDownOutlined,
  TextFieldsOutlined,
  MenuBookOutlined,
  ContentCutOutlined
} from '@vicons/material'

// Props
interface Props {
  visible: boolean
  result: SearchResult | null
  searchKeyword: string
  isExact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isExact: false
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
}>()

// Stores
const appStore = useAppStore()
const documentStore = useDocumentStore()

// 状态
const isFullMode = ref(false) // 全文/片段模式
const loading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const modalContainer = ref<HTMLElement | null>(null)

// 用于标记当前匹配的唯一ID
const currentMatchId = 'current-match-highlight'

// 字体大小（持久化）
const currentFontSize = useStorage('detail-font-size', 16)

// 集成双指缩放手势
const { setScale: setPinchScale } = usePinchZoom(scrollContainer, {
  minScale: appStore.config.minFontSize,
  maxScale: appStore.config.maxFontSize,
  step: 2,
  onZoom: (scale) => {
    setFontSizeWithScroll(scale)
  }
})

// 同步字体大小到双指缩放
watch(currentFontSize, (newSize) => {
  setPinchScale(newSize)
}, { immediate: true })

/**
 * 设置字体大小并保持滚动位置
 */
function setFontSizeWithScroll(newSize: number) {
  const container = scrollContainer.value
  if (!container) {
    currentFontSize.value = newSize
    return
  }

  const oldFontSize = currentFontSize.value
  const oldScrollTop = container.scrollTop
  const fontRatio = newSize / oldFontSize

  currentFontSize.value = newSize

  requestAnimationFrame(() => {
    container.scrollTop = oldScrollTop * fontRatio
  })
}

// 获取当前文档
const currentDocument = computed<Document | null>(() => {
  if (!props.result) return null
  return documentStore.getDocumentById(props.result.id) ?? null
})

// 文件名
const fileName = computed(() => {
  return props.result?.fileName ?? currentDocument.value?.fileName ?? '未知文档'
})

/**
 * 在纯文本上直接高亮，然后转换为HTML
 * 这样可以确保位置计算正确
 */
function highlightAndConvertToHtml(text: string, positions: number[]): string {
  if (!text) return ''

  // 将位置转换为 Set 便于查找
  const posSet = new Set(positions)

  // 逐字符处理，同时高亮和转义
  let result = ''
  let inHighlight = false
  let isFirstHighlight = true

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    const shouldHighlight = posSet.has(i)

    // 处理高亮状态变化
    if (shouldHighlight && !inHighlight) {
      // 开始高亮
      if (isFirstHighlight) {
        result += `<mark class="highlight" id="${currentMatchId}">`
        isFirstHighlight = false
      } else {
        result += '<mark class="highlight">'
      }
      inHighlight = true
    } else if (!shouldHighlight && inHighlight) {
      // 结束高亮
      result += '</mark>'
      inHighlight = false
    }

    // 处理换行符
    if (char === '\n') {
      if (inHighlight) {
        result += '</mark>'
      }
      result += '</div><div class="docx-p">'
      if (inHighlight) {
        result += '<mark class="highlight">'
      }
    } else {
      // 转义HTML特殊字符
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }
      result += entities[char] ?? char
    }
  }

  // 关闭最后的高亮标签
  if (inHighlight) {
    result += '</mark>'
  }

  // 包装在 div 中
  return `<div class="docx-p">${result}</div>`
}

/**
 * 计算高亮后的HTML内容
 * 使用 matchPositions 精确定位当前匹配，确保与列表高亮一致
 */
const highlightedHtml = computed(() => {
  const doc = currentDocument.value
  const result = props.result

  if (!doc) return '<div class="text-gray-400 py-4">无内容可显示</div>'

  const content = doc.content || ''
  if (!content) return '<div class="text-gray-400 py-4">无内容可显示</div>'

  const matchPositions = result?.matchPositions || []
  const matchIndex = result?.matchIndex ?? 0

  const range = appStore.config.detailRange || 200
  let displayStart = 0
  let displayEnd = content.length

  if (!isFullMode.value && matchPositions.length > 0) {
    displayStart = Math.max(0, matchIndex - range)
    displayEnd = Math.min(content.length, matchIndex + (result?.matchLength || 0) + range)
  }

  let snippet = content.slice(displayStart, displayEnd)

  const hasPrefix = displayStart > 0
  const hasSuffix = displayEnd < content.length
  if (hasPrefix) snippet = '...' + snippet
  if (hasSuffix) snippet = snippet + '...'

  // 调整位置偏移（考虑截取和省略号）
  const prefixOffset = hasPrefix ? 3 : 0
  const adjustedPositions = matchPositions
    .filter(pos => pos >= displayStart && pos < displayEnd)
    .map(pos => pos - displayStart + prefixOffset)

  // 直接在文本上高亮并转换为HTML
  return highlightAndConvertToHtml(snippet, adjustedPositions)
})

const displayContent = computed(() => highlightedHtml.value)

function close() {
  emit('close')
  emit('update:visible', false)
}

function scrollToHighlight() {
  nextTick(() => {
    const currentMark = scrollContainer.value?.querySelector(`#${currentMatchId}`)
    if (currentMark) {
      currentMark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const mark = scrollContainer.value?.querySelector('mark.highlight')
    if (mark) {
      mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  })
}

watch(() => props.result, (newVal) => {
  if (newVal) {
    isFullMode.value = false
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0
      }
      scrollToHighlight()
    })
  }
})

watch(isFullMode, () => {
  scrollToHighlight()
})

// 集成右滑关闭手势
const { isSwiping, swipeDistance, swipeDirection } = useGesture(modalContainer, {
  threshold: 100,
  onSwipeRight: () => close()
})

const swipeStyle = computed(() => {
  if (!isSwiping.value || swipeDirection.value !== 'right') return {}
  const progress = Math.min(swipeDistance.value / 100, 1)
  return {
    transform: `translateX(${swipeDistance.value * 0.3}px)`,
    opacity: 1 - progress * 0.3
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" @click="close" />
    </Transition>

    <!-- 弹窗内容 -->
    <Transition name="slide-up">
      <div v-if="visible" ref="modalContainer"
        class="fixed inset-0 z-50 flex flex-col bg-white transition-all duration-100" :style="swipeStyle">
        <!-- Header -->
        <div
          class="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur z-10 shrink-0">
          <!-- 关闭按钮 -->
          <button @click="close" class="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
            <KeyboardArrowDownOutlined class="w-6 h-6" />
          </button>

          <!-- 文件名 -->
          <h2 class="text-sm font-bold text-slate-800 truncate flex-1 min-w-0 mx-2">
            {{ fileName }}
          </h2>

          <!-- 工具栏 -->
          <div class="flex items-center gap-1 shrink-0">
            <!-- 字体大小滑块 -->
            <div class="h-8 flex items-center gap-1.5 bg-slate-50 px-2 rounded-full border border-slate-100">
              <TextFieldsOutlined class="w-4 h-4 text-slate-400" />
              <input type="range" :value="currentFontSize" :min="appStore.config.minFontSize"
                :max="appStore.config.maxFontSize"
                class="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                @input="setFontSizeWithScroll(Number(($event.target as HTMLInputElement).value))" />
              <TextFieldsOutlined class="w-5 h-5 text-slate-500" />
            </div>

            <!-- 全文/片段模式切换 -->
            <button @click="isFullMode = !isFullMode"
              class="h-8 px-3 flex items-center gap-1.5 rounded-full border transition-all"
              :class="isFullMode
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'" :title="isFullMode ? '当前为全文模式，点击切换到片段模式' : '当前为片段模式，点击切换到全文模式'">
              <MenuBookOutlined v-if="isFullMode" class="w-4 h-4" />
              <ContentCutOutlined v-else class="w-4 h-4" />
              {{ isFullMode ? '全文' : '片段' }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 p-5 pr-1 relative bg-white overflow-hidden">
          <div ref="scrollContainer" class="w-full h-full pr-4 overflow-y-auto custom-scrollbar">
            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-10">
              <div class="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>

            <!-- 内容区域 -->
            <div v-else
              class="doc-content-render max-w-none text-slate-700 leading-8 whitespace-pre-wrap wrap-break-word font-sans transition-all"
              :style="{ fontSize: currentFontSize + 'px', lineHeight: '1.6' }" v-html="displayContent" />

            <!-- 底部留白 -->
            <div class="h-40" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@reference "@/style.css";

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-3 h-3 bg-indigo-500 rounded-full cursor-pointer;
}

/* 文档内容渲染样式 */
:deep(.doc-content-render) {
  color: #334155;
  line-height: 1.8;
  word-break: break-word;
}

:deep(.doc-content-render p) {
  margin-bottom: 1em;
}

/* 高亮样式 */
:deep(mark),
:deep(mark.highlight) {
  background-color: #fef08a;
  color: #854d0e;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
  border-bottom: 2px solid #eab308;
}

/* docx 段落样式 */
:deep(.docx-p) {
  display: block !important;
  min-height: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.6;
  word-wrap: break-word;
}
</style>
