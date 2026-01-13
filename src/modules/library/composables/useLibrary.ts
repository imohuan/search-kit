/**
 * 文档库 Composable - 封装文件上传、解析、存储逻辑
 * Requirements: 3.1, 3.2
 */

import { ref, computed, onMounted } from 'vue'
import { useDocumentStore } from '@/stores/document.store'
import { fileParserService } from '@/services/fileParser.service'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { Document } from '@/types'

/**
 * 支持的文件类型
 */
const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt']

/**
 * 文档库 Composable
 * 提供文档上传、解析、存储、删除等功能
 */
export function useLibrary() {
  const documentStore = useDocumentStore()
  const toast = useToast()
  const { confirm } = useConfirm()

  // 上传状态
  const uploading = ref(false)
  const uploadProgress = ref(0)

  // 文档列表（从store获取）
  const documents = computed(() => documentStore.documents)
  const loading = computed(() => documentStore.loading)
  const hasDocuments = computed(() => documentStore.hasDocuments)

  /**
   * 初始化 - 加载文档列表
   */
  async function init(): Promise<void> {
    try {
      await documentStore.loadDocuments()
    } catch (e) {
      toast.error('加载文档列表失败')
    }
  }

  /**
   * 检查文件类型是否支持
   */
  function isSupportedFile(file: File): boolean {
    const extension = getFileExtension(file.name).toLowerCase()
    return SUPPORTED_EXTENSIONS.includes(extension)
  }

  /**
   * 获取文件扩展名
   */
  function getFileExtension(fileName: string): string {
    const parts = fileName.split('.')
    return parts.length > 1 ? (parts[parts.length - 1] ?? '') : ''
  }

  /**
   * 上传并解析文件
   * @param files 文件列表
   */
  async function uploadFiles(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files)

    if (fileArray.length === 0) {
      return
    }

    // 过滤支持的文件
    const supportedFiles = fileArray.filter(isSupportedFile)
    const unsupportedCount = fileArray.length - supportedFiles.length

    if (unsupportedCount > 0) {
      toast.warning(`${unsupportedCount} 个文件格式不支持，已跳过`)
    }

    if (supportedFiles.length === 0) {
      return
    }

    uploading.value = true
    uploadProgress.value = 0

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < supportedFiles.length; i++) {
      const file = supportedFiles[i]
      if (!file) continue

      try {
        // 解析文件
        const parseResult = await fileParserService.parseFile(file)

        // 保存到数据库
        const doc: Omit<Document, 'id'> = {
          fileName: file.name,
          content: parseResult.text,
          htmlContent: parseResult.html,
          date: new Date()
        }

        await documentStore.addDocument(doc)
        successCount++
      } catch (e) {
        console.error(`解析文件失败: ${file.name}`, e)
        failCount++
      }

      // 更新进度
      uploadProgress.value = Math.round(((i + 1) / supportedFiles.length) * 100)
    }

    uploading.value = false
    uploadProgress.value = 0

    // 显示结果
    if (successCount > 0 && failCount === 0) {
      toast.success(`成功上传 ${successCount} 个文件`)
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`上传完成: ${successCount} 成功, ${failCount} 失败`)
    } else if (failCount > 0) {
      toast.error(`上传失败: ${failCount} 个文件`)
    }
  }

  /**
   * 删除文档（带确认）
   * @param doc 文档对象
   */
  async function deleteDocument(doc: Document): Promise<boolean> {
    if (!doc.id) {
      toast.error('文档ID无效')
      return false
    }

    const confirmed = await confirm({
      title: '删除确认',
      message: `确定要删除文档 "${doc.fileName}" 吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    })

    if (!confirmed) {
      return false
    }

    try {
      await documentStore.deleteDocument(doc.id)
      toast.success('文档已删除')
      return true
    } catch (e) {
      toast.error('删除文档失败')
      return false
    }
  }

  /**
   * 根据ID获取文档
   */
  function getDocumentById(id: number): Document | undefined {
    return documentStore.getDocumentById(id)
  }

  // 组件挂载时初始化
  onMounted(() => {
    init()
  })

  return {
    // 状态
    documents,
    loading,
    uploading,
    uploadProgress,
    hasDocuments,

    // 方法
    init,
    uploadFiles,
    deleteDocument,
    getDocumentById,
    isSupportedFile
  }
}
