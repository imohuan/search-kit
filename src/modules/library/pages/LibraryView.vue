<script setup lang="ts">
/**
 * 文档库视图页面
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
import { ref, computed } from 'vue'
import { useLibrary } from '../composables/useLibrary'
import FileUploader from '../components/FileUploader.vue'
import FileList from '../components/FileList.vue'
import DetailModal from '@/components/modal/DetailModal.vue'
import type { Document, SearchResult } from '@/types'

const {
  documents,
  loading,
  uploading,
  uploadProgress,
  uploadFiles,
  deleteDocument
} = useLibrary()

// 预览弹窗状态
const showPreview = ref(false)
const previewDocument = ref<Document | null>(null)

// 将 Document 转换为 SearchResult 格式供 DetailModal 使用
const previewResult = computed<SearchResult | null>(() => {
  if (!previewDocument.value || !previewDocument.value.id) return null
  return {
    id: previewDocument.value.id,
    fileName: previewDocument.value.fileName,
    snippet: '', // 文档库预览不需要片段
    matchIndex: 0,
    matchCount: 0
  }
})

/**
 * 处理文件上传
 */
function handleUpload(files: FileList) {
  uploadFiles(files)
}

/**
 * 处理文档点击 - 打开预览
 */
function handleDocumentClick(doc: Document) {
  previewDocument.value = doc
  showPreview.value = true
}

/**
 * 处理文档删除
 */
function handleDocumentDelete(doc: Document) {
  deleteDocument(doc)
}

/**
 * 关闭预览弹窗
 */
function closePreview() {
  showPreview.value = false
  previewDocument.value = null
}
</script>

<template>
  <div class="library-view">
    <!-- 上传区域 -->
    <div class="upload-section">
      <FileUploader :uploading="uploading" :progress="uploadProgress" @upload="handleUpload" />
    </div>

    <!-- 文档列表 -->
    <div class="list-section">
      <div class="section-header">
        <h2 class="text-base font-medium text-gray-700">我的文档</h2>
        <span class="text-sm text-gray-400">{{ documents.length }} 个文档</span>
      </div>

      <FileList :documents="documents" :loading="loading" @click="handleDocumentClick" @delete="handleDocumentDelete" />
    </div>

    <!-- 文档预览弹窗 - 使用 DetailModal -->
    <DetailModal :visible="showPreview" :result="previewResult" search-keyword="" :is-exact="false"
      @close="closePreview" @update:visible="showPreview = $event" />
  </div>
</template>

<style scoped>
@reference "@/style.css";

.library-view {
  @apply flex flex-col h-full p-4 gap-4;
}

.upload-section {
  @apply shrink-0;
}

.list-section {
  @apply flex-1 flex flex-col min-h-0;
}

.section-header {
  @apply flex items-center justify-between mb-3;
}
</style>
