<script setup lang="ts">
/**
 * 详情页视图
 * 显示文档详细内容，支持全文/片段模式切换、关键词高亮
 */
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useAppStore } from '@/stores/app.store'
import { useDocumentStore } from '@/stores/document.store'
import { useDetailStore } from '@/stores/detail.store'
import { usePinchZoom } from '@/composables/usePinchZoom'
import type { Document } from '@/types'
import {
  KeyboardArrowLeftSharp as ArrowBackOutlined,
  TextFieldsOutlined,
  MenuBookOutlined,
  ContentCutOutlined,
} from '@vicons/material'

const router = useRouter()
const appStore = useAppStore()
const documentStore = useDocumentStore()
const detailStore = useDetailStore()

// 状态
const isFullMode = ref(false)
const loading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

// 用于标记当前匹配的唯一ID
const currentMatchId = 'current-match-highlight'

// 字体大小（持久化）
const currentFontSize = useStorage('detail-font-size', 16)

// 集成双指缩放手势
const { setScale: setPinchScale } = usePinchZoom(scrollContainer, {
  minScale: appStore.config.minFontSize,
  maxScale: appStore.config.maxFontSize,
  onZoom: (scale) => setFontSizeWithScroll(scale)
})

// 同步字体大小到双指缩放
watch(currentFontSize, (newSize) => setPinchScale(newSize), { immediate: true })

/** 设置字体大小并保持滚动位置 */
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
  if (!detailStore.currentResult) return null
  return documentStore.getDocumentById(detailStore.currentResult.id) ?? null
})

// 文件名
const fileName = computed(() => {
  return detailStore.currentResult?.fileName ?? currentDocument.value?.fileName ?? '未知文档'
})

/** 在纯文本上直接高亮，然后转换为HTML（过滤空行） */
function highlightAndConvertToHtml(text: string, positions: number[]): string {
  if (!text) return ''
  const posSet = new Set(positions)

  // 先按行分割，过滤空行，同时记录每行在原文中的起始位置
  const lines: { content: string; startPos: number }[] = []
  let currentPos = 0
  for (const line of text.split('\n')) {
    if (line.trim() !== '') {
      lines.push({ content: line, startPos: currentPos })
    }
    currentPos += line.length + 1 // +1 是换行符
  }

  // 处理每一行
  const htmlLines: string[] = []
  let isFirstHighlight = true

  for (const { content, startPos } of lines) {
    let lineHtml = ''
    let inHighlight = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]!
      const originalPos = startPos + i
      const shouldHighlight = posSet.has(originalPos)

      if (shouldHighlight && !inHighlight) {
        lineHtml += isFirstHighlight
          ? `<mark class="highlight" id="${currentMatchId}">`
          : '<mark class="highlight">'
        isFirstHighlight = false
        inHighlight = true
      } else if (!shouldHighlight && inHighlight) {
        lineHtml += '</mark>'
        inHighlight = false
      }

      const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
      lineHtml += entities[char] ?? char
    }

    if (inHighlight) lineHtml += '</mark>'
    htmlLines.push(`<div class="docx-p">${lineHtml}</div>`)
  }

  return htmlLines.join('')
}

/** 计算高亮后的HTML内容 */
const highlightedHtml = computed(() => {
  const doc = currentDocument.value
  const result = detailStore.currentResult
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

  const prefixOffset = hasPrefix ? 3 : 0
  const adjustedPositions = matchPositions
    .filter(pos => pos >= displayStart && pos < displayEnd)
    .map(pos => pos - displayStart + prefixOffset)

  return highlightAndConvertToHtml(snippet, adjustedPositions)
})

const displayContent = computed(() => highlightedHtml.value)

/** 返回上一页 */
function goBack() {
  router.back()
}

function scrollToHighlight() {
  nextTick(() => {
    const currentMark = scrollContainer.value?.querySelector(`#${currentMatchId}`)
    if (currentMark) {
      currentMark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const mark = scrollContainer.value?.querySelector('mark.highlight')
    if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

watch(isFullMode, () => scrollToHighlight())

onMounted(() => {
  // 如果没有数据，返回上一页
  if (!detailStore.currentResult) {
    router.replace(detailStore.fromRoute || '/search')
    return
  }
  nextTick(() => scrollToHighlight())
})
</script>

<template>
  <div class="detail-view">
    <!-- Header -->
    <div class="detail-header">
      <!-- 返回按钮 -->
      <button @click="goBack" class="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowBackOutlined class="w-5 h-5" />
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
            :max="appStore.config.maxFontSize" class="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
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
    <div class="detail-content">
      <div ref="scrollContainer" class="w-full h-full pr-4 overflow-y-auto custom-scrollbar">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-10">
          <div class="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>

        <!-- 内容区域 -->
        <div v-else
          class="doc-content-render max-w-none text-slate-700 leading-8 whitespace-pre-wrap wrap-break-word font-sans select-text"
          :style="{ fontSize: currentFontSize + 'px', lineHeight: '1.6' }" v-html="displayContent" />

        <!-- 底部留白 -->
        <div class="h-40" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.detail-view {
  @apply flex flex-col h-full bg-white transition-all duration-100;
}

.detail-header {
  @apply h-14 px-4 border-b border-slate-100 flex items-center justify-between;
  @apply bg-white/90 backdrop-blur z-10 shrink-0;
}

.detail-content {
  @apply flex-1 p-5 pr-1 relative bg-white overflow-hidden;
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
