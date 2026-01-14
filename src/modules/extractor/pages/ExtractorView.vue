<script setup lang="ts">
/**
 * 选字提取视图页面
 * Requirements: 4.1-4.8
 *
 * 组合输入模式和选字模式，提供完整的选字提取功能
 */
import { computed } from 'vue'
import { useExtractor } from '../composables/useExtractor'
import TextInput from '../components/TextInput.vue'
import CharGrid from '../components/CharGrid.vue'
import ExtractedList from '../components/ExtractedList.vue'
import ExtractorToolbar from '../components/ExtractorToolbar.vue'

const {
  currentStep,
  innerTab,
  rawText,
  hideSpaces,
  previewMode,
  symbolsCleared,
  charList,
  extractedList,
  selectedIndices,
  editingIndex,
  initSelection,
  handleAction,
  editItem,
  removeItem,
  copyItem,
  bindGridSelectionEvents,
  unbindGridSelectionEvents,
  toggleSymbolsCleared,
  selectAll,
  invertSelection,
  clearAllResults,
  backToInput
} = useExtractor()

// 选中数量
const selectedCount = computed(() => selectedIndices.value.size)

// 提取项数量
const extractedCount = computed(() => extractedList.value.length)

// 设置预览模式
function setPreviewMode(mode: 'full' | 'simple' | 'off') {
  previewMode.value = mode
}

// 清空选择
function clearSelection() {
  // 通过store清空
  selectedIndices.value.clear()
}

// 转换extractedList为CharGrid需要的格式
const extractedListForGrid = computed(() => {
  return extractedList.value.map(item => ({
    indices: item.indices,
    color: item.color
  }))
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 输入模式 -->
    <TextInput v-if="currentStep === 'input'" v-model="rawText" :has-extracted-results="extractedCount > 0"
      @enter-select="initSelection" @clear-results="clearAllResults" />

    <!-- 选字模式 -->
    <div v-else class="h-full flex flex-col overflow-hidden">
      <!-- 内部分栏导航 -->
      <div class="flex border-b border-slate-100 bg-white relative shrink-0">
        <button @click="innerTab = 'select'" :class="[
          'flex-1 py-3 text-sm font-bold transition-colors',
          innerTab === 'select' ? 'text-indigo-600' : 'text-slate-400'
        ]">
          文本选字
        </button>
        <button @click="innerTab = 'list'" :class="[
          'flex-1 py-3 text-sm font-bold transition-colors relative',
          innerTab === 'list' ? 'text-indigo-600' : 'text-slate-400'
        ]">
          提取结果
          <span v-if="extractedCount > 0"
            class="ml-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
            {{ extractedCount }}
          </span>
        </button>
        <!-- 滑动指示器 -->
        <div class="absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 w-1/2"
          :style="{ transform: `translateX(${innerTab === 'select' ? '0' : '100'}%)` }" />
      </div>

      <!-- 内容区 -->
      <div class="flex-1 overflow-hidden relative">
        <!-- 选字面板 -->
        <CharGrid v-show="innerTab === 'select'" :char-list="charList" :selected-indices="selectedIndices"
          :hide-spaces="hideSpaces" :filter-symbols="symbolsCleared" :preview-mode="previewMode"
          :extracted-list="extractedListForGrid" :bind-selection-events="bindGridSelectionEvents"
          :unbind-selection-events="unbindGridSelectionEvents" />

        <!-- 结果面板 -->
        <ExtractedList v-show="innerTab === 'list'" :extracted-list="extractedList" @edit="editItem" @copy="copyItem"
          @remove="removeItem" />
      </div>

      <!-- 底部工具栏 -->
      <ExtractorToolbar :inner-tab="innerTab" :preview-mode="previewMode" :symbols-cleared="symbolsCleared"
        :selected-count="selectedCount" :extracted-count="extractedCount" :editing-index="editingIndex"
        @back="backToInput" @set-preview-mode="setPreviewMode" @toggle-symbols-cleared="toggleSymbolsCleared"
        @select-all="selectAll" @invert-selection="invertSelection" @clear-selection="clearSelection"
        @extract="handleAction" @clear-all-results="clearAllResults" />
    </div>
  </div>
</template>
