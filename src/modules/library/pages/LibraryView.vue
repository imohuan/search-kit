<script setup lang="ts">
/**
 * 文档库视图页面
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
import { useRouter } from 'vue-router'
import { useLibrary } from '../composables/useLibrary'
import { useDetailStore } from '@/stores/detail.store'
import FileUploader from '../components/FileUploader.vue'
import FileList from '../components/FileList.vue'
import type { Document, SearchResult } from '@/types'

const router = useRouter()
const detailStore = useDetailStore()

const {
  documents,
  loading,
  uploading,
  uploadProgress,
  uploadFiles,
  deleteDocument
} = useLibrary()

/**
 * 处理文件上传
 */
function handleUpload(files: FileList) {
  uploadFiles(files)
}

/**
 * 处理文档点击 - 跳转到详情页
 */
function handleDocumentClick(doc: Document) {
  if (!doc.id) return
  // 将 Document 转换为 SearchResult 格式
  const result: SearchResult = {
    id: doc.id,
    fileName: doc.fileName,
    content: doc.content,
    matchIndex: 0,
    matchLength: 0,
    matchPositions: [],
    highlightedSnippet: ''
  }
  detailStore.setDetail(result, '', false, '/library')
  router.push({ name: 'detail', params: { id: doc.id }, query: { from: 'library' } })
}

/**
 * 处理文档删除
 */
function handleDocumentDelete(doc: Document) {
  deleteDocument(doc)
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
