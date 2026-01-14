<script setup lang="ts">
/**
 * 详情弹窗组件
 * 显示搜索结果的详细内容，支持全文/片段模式切换、原版/纯净样式切换、关键词高亮
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { useAppStore } from '@/stores/app.store'
import { useDocumentStore } from '@/stores/document.store'
import { useGesture } from '@/composables/useGesture'
import type { SearchResult, Document } from '@/types'
import {
  KeyboardArrowDownOutlined,
  TextFieldsOutlined,
  MenuBookOutlined,
  ContentCutOutlined,
  FormatPaintOutlined
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
const showOriginal = ref(true) // 原版/纯净样式
const loading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const modalContainer = ref<HTMLElement | null>(null)

// 字体大小（持久化）
const currentFontSize = useStorage('detail-font-size', 16)

// 获取当前文档
const currentDocument = computed<Document | null>(() => {
  if (!props.result) return null
  return documentStore.getDocumentById(props.result.id) ?? null
})

// 文件名
const fileName = computed(() => {
  return props.result?.fileName ?? currentDocument.value?.fileName ?? '未知文档'
})

// 是否支持原始样式
const supportsOriginalStyles = computed(() => {
  return currentDocument.value?.hasOriginalStyles ?? false
})

/**
 * 去除HTML中的颜色样式，但保留结构类名
 */
function stripStyles(html: string): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  const els = div.querySelectorAll('*')
  els.forEach(el => {
    el.removeAttribute('style')
    // 保留 docx-p 类名，用于换行
    const classes = el.getAttribute('class')
    if (classes && !classes.includes('docx-p')) {
      el.removeAttribute('class')
    }
  })
  return div.innerHTML
}

/**
 * 将纯文本转换为带换行的HTML
 */
function textToHtml(text: string): string {
  if (!text) return ''
  // 转义HTML特殊字符
  const escaped = text.replace(/[&<>"']/g, m => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return entities[m] ?? m
  })
  // 将换行符转换为div，确保每行显示
  return escaped.split('\n').map(line => `<div class="docx-p">${line || '<br>'}</div>`).join('')
}

/**
 * 获取HTML片段（带高亮）
 * 从HTML内容中提取指定范围的片段，并高亮关键词
 */
function getHtmlFragment(
  html: string,
  keyword: string,
  _maxGap: number,
  range: number
): string {
  if (!html) return ''
  if (!keyword) return html
  
  // 创建临时DOM解析HTML
  const div = document.createElement('div')
  div.innerHTML = html
  const textContent = div.textContent || ''
  
  // 查找关键词位置
  const lowerText = textContent.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const keywordIndex = lowerText.indexOf(lowerKeyword)
  
  if (keywordIndex === -1 && !props.isExact) {
    // 间隔搜索模式：查找第一个字符的位置
    const firstChar = lowerKeyword[0]
    const firstIndex = firstChar ? lowerText.indexOf(firstChar) : -1
    if (firstIndex === -1) {
      // 没找到，直接高亮所有匹配字符
      return highlightHtml(html, keyword, props.isExact)
    }
  }
  
  // 如果range为0，表示全文模式，只高亮不截取
  if (range === 0) {
    return highlightHtml(html, keyword, props.isExact)
  }
  
  // 片段模式：截取指定范围
  const startPos = Math.max(0, keywordIndex - range)
  const endPos = Math.min(textContent.length, keywordIndex + keyword.length + range)
  
  // 提取片段文本
  let snippetText = textContent.slice(startPos, endPos)
  
  // 添加省略号
  if (startPos > 0) snippetText = '...' + snippetText
  if (endPos < textContent.length) snippetText = snippetText + '...'
  
  // 转换为HTML并高亮
  const snippetHtml = textToHtml(snippetText)
  return highlightHtml(snippetHtml, keyword, props.isExact)
}

/**
 * 高亮HTML中的关键词
 */
function highlightHtml(html: string, keyword: string, isExact: boolean): string {
  if (!html || !keyword) return html
  
  // 创建临时DOM
  const div = document.createElement('div')
  div.innerHTML = html
  
  // 遍历所有文本节点并高亮
  highlightTextNodes(div, keyword, isExact)
  
  return div.innerHTML
}

/**
 * 递归高亮文本节点
 */
function highlightTextNodes(node: Node, keyword: string, isExact: boolean): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || ''
    if (!text.trim()) return
    
    const highlighted = isExact
      ? highlightExactText(text, keyword)
      : highlightIntervalText(text, keyword)
    
    if (highlighted !== text) {
      const span = document.createElement('span')
      span.innerHTML = highlighted
      node.parentNode?.replaceChild(span, node)
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // 跳过已经是mark标签的节点
    if ((node as Element).tagName === 'MARK') return
    
    // 递归处理子节点（需要复制数组，因为会修改DOM）
    const children = Array.from(node.childNodes)
    children.forEach(child => highlightTextNodes(child, keyword, isExact))
  }
}

/**
 * 精确搜索高亮
 */
function highlightExactText(text: string, keyword: string): string {
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const parts: string[] = []
  let lastIndex = 0
  
  let index = lowerText.indexOf(lowerKeyword)
  while (index !== -1) {
    // 添加匹配前的文本
    if (index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, index)))
    }
    // 添加高亮的匹配文本
    parts.push(`<mark class="highlight">${escapeHtml(text.slice(index, index + keyword.length))}</mark>`)
    lastIndex = index + keyword.length
    index = lowerText.indexOf(lowerKeyword, lastIndex)
  }
  
  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)))
  }
  
  return parts.join('')
}

/**
 * 间隔搜索高亮（高亮所有查询字符出现的位置）
 */
function highlightIntervalText(text: string, keyword: string): string {
  const lowerKeyword = keyword.toLowerCase()
  const queryChars = new Set(lowerKeyword.split(''))
  let result = ''
  
  for (const char of text) {
    if (queryChars.has(char.toLowerCase())) {
      result += `<mark class="highlight">${escapeHtml(char)}</mark>`
    } else {
      result += escapeHtml(char)
    }
  }
  
  return result
}

/**
 * 转义HTML特殊字符
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, char => htmlEntities[char] ?? char)
}

/**
 * 计算高亮后的HTML内容
 */
const highlightedHtml = computed(() => {
  // 1. 获取基础HTML（优先使用htmlContent，否则从content生成）
  let baseHtml = currentDocument.value?.htmlContent || ''
  
  // 如果没有htmlContent，从纯文本content生成
  if (!baseHtml && currentDocument.value?.content) {
    baseHtml = textToHtml(currentDocument.value.content)
  }
  
  if (!baseHtml) return '<div class="text-gray-400 py-4">无内容可显示</div>'
  
  // 2. 纯净模式：去除颜色样式，但保留结构
  if (!showOriginal.value) {
    baseHtml = stripStyles(baseHtml)
  }
  
  // 3. 应用搜索高亮
  if (!isFullMode.value) {
    // 片段模式：截取并高亮
    const range = appStore.config.detailRange || 200
    return getHtmlFragment(baseHtml, props.searchKeyword, appStore.config.maxSearchGap, range)
  } else {
    // 全文模式：只高亮不截取
    if (props.searchKeyword) {
      return getHtmlFragment(baseHtml, props.searchKeyword, appStore.config.maxSearchGap, 0)
    }
    return baseHtml
  }
})

/**
 * 显示内容
 */
const displayContent = computed(() => {
  return highlightedHtml.value
})

/**
 * 关闭弹窗
 */
function close() {
  emit('close')
  emit('update:visible', false)
}

/**
 * 滚动到高亮位置
 */
function scrollToHighlight() {
  nextTick(() => {
    const mark = scrollContainer.value?.querySelector('mark.highlight')
    if (mark) {
      mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  })
}

// 监听item变化，重置状态
watch(() => props.result, (newVal) => {
  if (newVal) {
    // 重置为片段模式
    isFullMode.value = false
    
    // 如果文档支持原始样式，默认显示原始样式；否则显示纯净文本
    showOriginal.value = supportsOriginalStyles.value
    
    // 滚动到顶部
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0
      }
      // 滚动到高亮位置
      scrollToHighlight()
    })
  }
})

// 监听模式切换，滚动到高亮位置
watch(isFullMode, () => {
  scrollToHighlight()
})

// 集成右滑关闭手势
const { isSwiping, swipeDistance, swipeDirection } = useGesture(modalContainer, {
  threshold: 100,
  onSwipeRight: () => {
    close()
  }
})

// 计算滑动时的视觉反馈样式
const swipeStyle = computed(() => {
  if (!isSwiping.value || swipeDirection.value !== 'right') {
    return {}
  }
  // 根据滑动距离计算透明度和位移
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
      <div
        v-if="visible"
        class="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        @click="close"
      />
    </Transition>
    
    <!-- 弹窗内容 -->
    <Transition name="slide-up">
      <div
        v-if="visible"
        ref="modalContainer"
        class="fixed inset-0 z-50 flex flex-col bg-white transition-all duration-100"
        :style="swipeStyle"
      >
        <!-- Header -->
        <div class="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur z-10 shrink-0">
          <!-- 关闭按钮 -->
          <button
            @click="close"
            class="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
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
              <input
                type="range"
                v-model.number="currentFontSize"
                :min="appStore.config.minFontSize"
                :max="appStore.config.maxFontSize"
                class="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <TextFieldsOutlined class="w-5 h-5 text-slate-500" />
            </div>
            
            <!-- 全文/片段模式切换 -->
            <button
              @click="isFullMode = !isFullMode"
              class="h-8 px-3 flex items-center gap-1.5 rounded-full border transition-all"
              :class="isFullMode
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'"
              :title="isFullMode ? '当前为全文模式，点击切换到片段模式' : '当前为片段模式，点击切换到全文模式'"
            >
              <MenuBookOutlined v-if="isFullMode" class="w-4 h-4" />
              <ContentCutOutlined v-else class="w-4 h-4" />
              {{ isFullMode ? '全文' : '片段' }}
            </button>
            
            <!-- 原版/纯净样式切换 -->
            <button
              @click="showOriginal = !showOriginal"
              :disabled="!supportsOriginalStyles"
              class="h-8 w-8 flex items-center justify-center rounded-full transition-all border"
              :class="[
                supportsOriginalStyles
                  ? showOriginal
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-100 text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'
                  : 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed opacity-50'
              ]"
              :title="!supportsOriginalStyles
                ? '该文档不支持原始样式预览'
                : showOriginal
                  ? '显示纯净文本(支持高亮)'
                  : '显示原版样式(背景/颜色)'"
            >
              <FormatPaintOutlined class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 p-5 pr-1 relative bg-white overflow-hidden">
          <div
            ref="scrollContainer"
            class="w-full h-full pr-4 overflow-y-auto custom-scrollbar"
          >
            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-10">
              <div class="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
            
            <!-- 内容区域 -->
            <div
              v-else
              class="doc-content-render max-w-none text-slate-700 leading-8 whitespace-pre-wrap wrap-break-word font-sans transition-all"
              :style="{ fontSize: currentFontSize + 'px', lineHeight: '1.6' }"
              v-html="displayContent"
            />
            
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

:deep(.doc-content-render h1) {
  font-size: 1.5em;
  font-weight: 800;
  margin: 1.2em 0 0.6em;
  color: #1e293b;
}

:deep(.doc-content-render h2) {
  font-size: 1.3em;
  font-weight: 700;
  margin: 1em 0 0.5em;
  color: #1e293b;
}

:deep(.doc-content-render h3) {
  font-size: 1.1em;
  font-weight: 700;
  margin: 0.8em 0 0.4em;
}

:deep(.doc-content-render strong) {
  color: #0f172a;
  font-weight: 700;
}

:deep(.doc-content-render table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.9em;
}

:deep(.doc-content-render th),
:deep(.doc-content-render td) {
  border: 1px solid #e2e8f0;
  padding: 0.5em;
  text-align: left;
}

:deep(.doc-content-render th) {
  background-color: #f8fafc;
  font-weight: 600;
}

:deep(.doc-content-render ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin-bottom: 1em;
}

:deep(.doc-content-render ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
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
  display: block;
  min-height: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.6;
  word-wrap: break-word;
}

/* 纯文本换行支持 */
:deep(.plain-text-content) {
  white-space: pre-line;
  word-wrap: break-word;
}
</style>
