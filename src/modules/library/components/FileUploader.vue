<script setup lang="ts">
/**
 * 文件上传组件 - 拖拽上传区域
 * Requirements: 5.1, 5.2
 */
import { ref } from 'vue'
import { CloudUploadOutlined } from '@vicons/material'

const emit = defineEmits<{
  upload: [files: FileList]
}>()

defineProps<{
  uploading?: boolean
  progress?: number
}>()

// 拖拽状态
const isDragging = ref(false)

// 文件输入引用
const fileInputRef = ref<HTMLInputElement | null>(null)

/**
 * 处理拖拽进入
 */
function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

/**
 * 处理拖拽离开
 */
function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

/**
 * 处理拖拽悬停
 */
function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

/**
 * 处理文件放置
 */
function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}

/**
 * 处理文件选择
 */
function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
  // 重置input以允许重复选择同一文件
  target.value = ''
}
</script>

<template>
  <label class="file-uploader" :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
    @dragenter="handleDragEnter" @dragleave="handleDragLeave" @dragover="handleDragOver" @drop="handleDrop">
    <input ref="fileInputRef" type="file" multiple accept=".pdf,.docx,.txt" class="hidden" @change="handleFileChange">

    <!-- 上传中状态 -->
    <template v-if="uploading">
      <div class="upload-progress">
        <div class="progress-bar" :style="{ width: `${progress}%` }" />
      </div>
      <p class="text-slate-500 text-sm mt-2">上传中... {{ progress }}%</p>
    </template>

    <!-- 默认状态 -->
    <template v-else>
      <div class="upload-icon-container">
        <CloudUploadOutlined class="upload-icon" />
      </div>
      <p class="text-slate-700 text-sm font-semibold mt-2">
        {{ isDragging ? '松开以上传文件' : '点击上传文档' }}
      </p>
      <p class="text-slate-400 text-xs mt-1">支持 PDF、DOCX、TXT 格式</p>
    </template>
  </label>
</template>

<style scoped>
@reference "@/style.css";

.file-uploader {
  @apply flex flex-col items-center justify-center w-full h-32;
  @apply border-2 border-dashed border-slate-200 rounded-2xl;
  @apply cursor-pointer bg-slate-50;
  @apply hover:bg-indigo-50 hover:border-indigo-300;
  @apply transition-colors duration-200;
}

.file-uploader.is-dragging {
  @apply border-indigo-500 bg-indigo-50;
}

.file-uploader.is-uploading {
  @apply cursor-default border-slate-200 bg-slate-50;
}

.upload-icon-container {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
  @apply transition-colors duration-200;
}

.file-uploader:hover .upload-icon-container {
  @apply text-indigo-200;
}

.upload-icon {
  @apply text-indigo-600 size-6;
}

.upload-progress {
  @apply w-full max-w-[200px] h-2 bg-slate-200 rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-indigo-500 transition-all duration-300;
}
</style>
