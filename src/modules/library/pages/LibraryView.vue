<script setup lang="ts">
/**
 * 文档库视图页面
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */
import { ref } from 'vue'
import { useLibrary } from '../composables/useLibrary'
import FileUploader from '../components/FileUploader.vue'
import FileList from '../components/FileList.vue'
import type { Document } from '@/types'

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
      <FileUploader
        :uploading="uploading"
        :progress="uploadProgress"
        @upload="handleUpload"
      />
    </div>

    <!-- 文档列表 -->
    <div class="list-section">
      <div class="section-header">
        <h2 class="text-base font-medium text-gray-700">我的文档</h2>
        <span class="text-sm text-gray-400">{{ documents.length }} 个文档</span>
      </div>
      
      <FileList
        :documents="documents"
        :loading="loading"
        @click="handleDocumentClick"
        @delete="handleDocumentDelete"
      />
    </div>

    <!-- 文档预览弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPreview && previewDocument"
          class="fixed inset-0 z-50 flex items-end justify-center"
        >
          <!-- 遮罩层 -->
          <div
            class="absolute inset-0 bg-black/50"
            @click="closePreview"
          />
          
          <!-- 弹窗内容 -->
          <div class="preview-modal">
            <!-- 头部 -->
            <div class="preview-header">
              <h3 class="font-medium text-gray-900 truncate flex-1">
                {{ previewDocument.fileName }}
              </h3>
              <button
                class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                @click="closePreview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- 内容 -->
            <div class="preview-content">
              <div
                v-if="previewDocument.htmlContent"
                class="prose prose-sm max-w-none"
                v-html="previewDocument.htmlContent"
              />
              <pre v-else class="whitespace-pre-wrap text-sm text-gray-700">{{ previewDocument.content }}</pre>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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

/* 预览弹窗样式 */
.preview-modal {
  @apply relative bg-white rounded-t-2xl w-full max-h-[80vh];
  @apply flex flex-col overflow-hidden;
  @apply shadow-xl;
}

.preview-header {
  @apply flex items-center gap-2 px-4 py-3;
  @apply border-b border-gray-100;
  @apply shrink-0;
}

.preview-content {
  @apply flex-1 overflow-y-auto p-4;
}

/* 弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .preview-modal,
.modal-leave-active .preview-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .preview-modal {
  transform: translateY(100%);
}

.modal-leave-to .preview-modal {
  transform: translateY(100%);
}

/* Prose样式覆盖 */
.preview-content :deep(p) {
  @apply my-2;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  @apply font-bold my-3;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  @apply pl-5 my-2;
}

.preview-content :deep(li) {
  @apply my-1;
}
</style>
