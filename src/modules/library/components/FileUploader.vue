<script setup lang="ts">
/**
 * 文件上传组件 - 拖拽上传区域
 * Requirements: 3.1, 3.3
 */
import { ref } from 'vue'

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
 * 点击选择文件
 */
function handleClick() {
  fileInputRef.value?.click()
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
  <div
    class="file-uploader"
    :class="{ 'is-dragging': isDragging, 'is-uploading': uploading }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @click="handleClick"
  >
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".pdf,.docx,.txt"
      class="hidden"
      @change="handleFileChange"
    >
    
    <!-- 上传中状态 -->
    <template v-if="uploading">
      <div class="upload-progress">
        <div class="progress-bar" :style="{ width: `${progress}%` }" />
      </div>
      <p class="text-gray-500 text-sm mt-2">上传中... {{ progress }}%</p>
    </template>
    
    <!-- 默认状态 -->
    <template v-else>
      <div class="upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>
      <p class="text-gray-600 text-sm mt-2">
        {{ isDragging ? '松开以上传文件' : '点击或拖拽文件到此处' }}
      </p>
      <p class="text-gray-400 text-xs mt-1">支持 PDF、DOCX、TXT 格式</p>
    </template>
  </div>
</template>

<style scoped>
@reference "@/style.css";

.file-uploader {
  @apply border-2 border-dashed border-gray-300 rounded-xl p-6;
  @apply flex flex-col items-center justify-center;
  @apply cursor-pointer transition-all duration-200;
  @apply min-h-[140px];
}

.file-uploader:hover {
  @apply border-blue-400 bg-blue-50/50;
}

.file-uploader.is-dragging {
  @apply border-blue-500 bg-blue-50;
}

.file-uploader.is-uploading {
  @apply cursor-default border-gray-300 bg-gray-50;
}

.upload-icon {
  @apply text-gray-400;
}

.file-uploader:hover .upload-icon,
.file-uploader.is-dragging .upload-icon {
  @apply text-blue-500;
}

.upload-progress {
  @apply w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-blue-500 transition-all duration-300;
}
</style>
