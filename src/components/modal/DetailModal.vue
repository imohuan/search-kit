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
import { usePinchZoom } from '@/composables/usePinchZoom'
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
const showOriginal = ref(true) // 原版/纯净样式，默认显示原版样式
const loading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)
const modalContainer = ref<HTMLElement | null>(null)

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
 * 核心思路：字体变化后，scrollTop 按照字体比例缩放
 */
function setFontSizeWithScroll(newSize: number) {
  const container = scrollContainer.value

  if (!container) {
    currentFontSize.value = newSize
    return
  }

  const oldFontSize = currentFontSize.value
  const oldScrollTop = container.scrollTop

  // 计算字体缩放比例
  const fontRatio = newSize / oldFontSize

  // 更新字体大小
  currentFontSize.value = newSize

  // 按字体比例调整滚动位置
  // 字体变大，内容变高，需要滚动更多；字体变小，内容变矮，需要滚动更少
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
 * 去除HTML中的颜色样式，但保留结构类名
 */
function stripStyles(html: string): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  const els = div.querySelectorAll('*')
  els.forEach(el => {
    el.removeAttribute('style')
    // 保留 docx-p 和 docx-br 类名，用于换行
    const classes = el.getAttribute('class')
    if (classes && !classes.includes('docx-p') && !classes.includes('docx-br')) {
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
 * 获取HTML片段（带高亮）- 基于 DOM Range API
 * 从HTML内容中提取指定范围的片段，保留原始HTML结构，并高亮关键词
 */
function getHtmlFragment(
  html: string,
  keyword: string,
  maxGap: number,
  limit: number
): string {
  if (!html) return ''

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // 1. 先进行高亮处理
  if (keyword) {
    highlightHtmlElement(tempDiv, keyword, maxGap, props.isExact)
  }

  // 2. 如果不需要截取（全文模式使用0表示），直接返回
  if (!limit || limit <= 0) return tempDiv.innerHTML

  // 3. 寻找截取中心点 (第一个 mark 或开头)
  let centerNode: Node | null = null
  let centerOffset = 0
  const firstMark = tempDiv.querySelector('mark.highlight')

  if (firstMark && firstMark.firstChild) {
    centerNode = firstMark.firstChild
    centerOffset = 0
  } else {
    // 没有匹配项，从头开始
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT)
    centerNode = walker.nextNode()
    centerOffset = 0
  }

  if (!centerNode) return tempDiv.innerHTML // 空内容

  // 4. 计算所有文本节点序列，定位 Range 边界
  const textNodes: Node[] = []
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node)
  }

  // 找到 centerNode 在列表中的位置
  const centerIndex = textNodes.indexOf(centerNode)
  if (centerIndex === -1) return tempDiv.innerHTML

  // 向前/向后累加字符长度，找到 startNode 和 endNode
  let startNode: Node = centerNode
  let startOffset = centerOffset
  let endNode: Node = centerNode
  let endOffset = centerNode.textContent?.length || 0

  // 向前查找
  let remaining = limit / 2

  // 当前节点之前的
  if (centerIndex >= 0) {
    remaining -= centerOffset
    startNode = textNodes[centerIndex]!
    startOffset = Math.max(0, centerOffset - Math.floor(limit / 2))
  }

  for (let j = centerIndex - 1; j >= 0; j--) {
    const len = textNodes[j]?.textContent?.length || 0
    if (remaining <= 0) break

    if (remaining <= len) {
      startNode = textNodes[j]!
      startOffset = len - remaining
      remaining = 0
    } else {
      startNode = textNodes[j]!
      startOffset = 0
      remaining -= len
    }
  }

  // 向后查找
  remaining = limit / 2
  const currentNodeLen = textNodes[centerIndex]?.textContent?.length || 0
  if (centerIndex < textNodes.length && textNodes[centerIndex]) {
    remaining -= (currentNodeLen - centerOffset)
    endNode = textNodes[centerIndex]!
    endOffset = currentNodeLen
  }

  for (let j = centerIndex + 1; j < textNodes.length; j++) {
    const len = textNodes[j]?.textContent?.length || 0
    if (remaining <= 0) break

    if (remaining <= len) {
      endNode = textNodes[j]!
      endOffset = remaining
      remaining = 0
    } else {
      endNode = textNodes[j]!
      endOffset = len
      remaining -= len
    }
  }

  // 5. 使用 Range 提取片段 (保留 DOM 结构)
  try {
    const range = document.createRange()
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    const fragment = range.cloneContents()
    const container = document.createElement('div')
    container.appendChild(fragment)
    return container.innerHTML
  } catch (e) {
    console.error('Range extraction failed', e)
    return tempDiv.innerHTML // Fallback
  }
}

/**
 * 在 DOM 元素上直接进行高亮（不返回字符串，直接修改 DOM）
 */
function highlightHtmlElement(element: HTMLElement, keyword: string, maxGap: number, isExact: boolean): void {
  // 1. 获取所有文本节点及其在完整文本中的位置
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const textNodes: { node: Node; start: number; end: number }[] = []
  let fullText = ''
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push({
      node,
      start: fullText.length,
      end: fullText.length + (node.textContent?.length || 0)
    })
    fullText += node.textContent || ''
  }

  // 2. 收集所有需要高亮的精确片段
  const highlightRanges: { start: number; end: number }[] = []

  if (isExact) {
    // 精确搜索：查找连续匹配
    const lowerText = fullText.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    let searchStart = 0
    let index: number
    while ((index = lowerText.indexOf(lowerKeyword, searchStart)) !== -1) {
      highlightRanges.push({
        start: index,
        end: index + keyword.length
      })
      searchStart = index + keyword.length
    }
  } else {
    // 间隔搜索：使用正则匹配
    const regex = createSearchRegex(keyword, maxGap)
    if (!regex) return

    let match: RegExpExecArray | null
    regex.lastIndex = 0

    while ((match = regex.exec(fullText)) !== null) {
      // regex 结构: (char)(gap)(char)(gap)...
      // match[1], match[3]... 是关键词字符 (需要高亮)
      // match[2], match[4]... 是间隔 (不需要高亮)
      let currentPos = match.index

      for (let i = 1; i < match.length; i++) {
        const segment = match[i]
        const len = segment ? segment.length : 0

        // 奇数索引为关键词部分 (group 1, 3, 5...)
        if (i % 2 === 1 && len > 0) {
          highlightRanges.push({
            start: currentPos,
            end: currentPos + len
          })
        }

        currentPos += len
      }

      if (match.index === regex.lastIndex) regex.lastIndex++
    }
  }

  if (highlightRanges.length === 0) return

  // 3. 将高亮区间应用到文本节点
  textNodes.forEach(tn => {
    // 找出所有落在当前文本节点范围内的高亮区间
    const nodeMatches: { start: number; end: number }[] = []
    highlightRanges.forEach(range => {
      if (range.start < tn.end && range.end > tn.start) {
        nodeMatches.push({
          start: Math.max(range.start, tn.start) - tn.start, // 转为节点相对坐标
          end: Math.min(range.end, tn.end) - tn.start
        })
      }
    })

    if (nodeMatches.length === 0) return

    // 排序并合并重叠区间
    nodeMatches.sort((a, b) => a.start - b.start)
    const merged: { start: number; end: number }[] = []
    let current = nodeMatches[0]!
    for (let i = 1; i < nodeMatches.length; i++) {
      if (nodeMatches[i]!.start <= current.end) {
        current.end = Math.max(current.end, nodeMatches[i]!.end)
      } else {
        merged.push(current)
        current = nodeMatches[i]!
      }
    }
    merged.push(current)

    // 4. 构建包含高亮的 Fragment 替换原节点
    const text = tn.node.textContent || ''
    const fragment = document.createDocumentFragment()
    let cursor = 0

    merged.forEach(m => {
      if (m.start > cursor) {
        fragment.appendChild(document.createTextNode(text.substring(cursor, m.start)))
      }
      const newMark = document.createElement('mark')
      newMark.className = 'highlight'
      newMark.textContent = text.substring(m.start, m.end)
      fragment.appendChild(newMark)
      cursor = m.end
    })

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(cursor)))
    }

    // 只有父节点存在时才替换
    if (tn.node.parentNode) {
      tn.node.parentNode.replaceChild(fragment, tn.node)
    }
  })
}

/**
 * 创建间隔搜索正则表达式
 */
function createSearchRegex(keyword: string, maxGap: number): RegExp | null {
  const chars = keyword.split('').filter(c => c.trim() !== '')
  if (chars.length === 0) return null

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const gapPattern = `([\\s\\S]{0,${maxGap}}?)`
  const pattern = chars.map(c => `(${escapeRegExp(c)})`).join(gapPattern)

  try {
    return new RegExp(pattern, 'gi')
  } catch (e) {
    console.error('Regex too complex', e)
    return null
  }
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

  // 2. 应用样式模式（原版/纯净）
  // 注意：必须在高亮之前处理，否则会破坏高亮标签
  if (!showOriginal.value) {
    baseHtml = stripStyles(baseHtml)
  }

  // 3. 应用搜索高亮和片段截取
  const maxGap = appStore.config.maxSearchGap || 30

  if (!isFullMode.value) {
    // 片段模式：截取并高亮（使用 DOM Range API 保留 HTML 结构）
    const range = appStore.config.detailRange || 200
    return getHtmlFragment(baseHtml, props.searchKeyword, maxGap, range)
  } else {
    // 全文模式：只高亮不截取
    return getHtmlFragment(baseHtml, props.searchKeyword, maxGap, 0)
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

    // 默认显示原版样式
    showOriginal.value = true

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

            <!-- 原版/纯净样式切换 -->
            <button @click="showOriginal = !showOriginal"
              class="h-8 w-8 flex items-center justify-center rounded-full transition-all border" :class="[
                showOriginal
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-slate-100 text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'
              ]" :title="showOriginal
                ? '显示纯净文本'
                : '显示原版样式'">
              <FormatPaintOutlined class="w-5 h-5" />
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
  display: block !important;
  min-height: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.6;
  word-wrap: break-word;
}

/* docx 换行标签强制换行 */
:deep(.docx-br) {
  display: block;
  content: "";
  margin-bottom: 0.3em;
}

/* 纯文本换行支持 */
:deep(.plain-text-content) {
  white-space: pre-line;
  word-wrap: break-word;
}
</style>
