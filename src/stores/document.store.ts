/**
 * 文档Store - 管理文档列表状态
 * Requirements: 3.2, 3.3, 3.5
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { dbService } from "@/services/db.service";
import type { Document } from "@/types";

/**
 * 文档Store
 * 管理文档列表的加载、添加、删除操作
 */
export const useDocumentStore = defineStore("document", () => {
  // 文档列表
  const documents = ref<Document[]>([]);

  // 加载状态
  const loading = ref(false);

  // 错误信息
  const error = ref<string | null>(null);

  // 文档数量
  const documentCount = computed(() => documents.value.length);

  // 是否有文档
  const hasDocuments = computed(() => documents.value.length > 0);

  /**
   * 加载所有文档
   * 从IndexedDB加载文档列表，按日期降序排列
   */
  async function loadDocuments(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      documents.value = await dbService.getDocuments();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "加载文档失败";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加文档
   * @param doc 文档对象（不含id）
   * @returns 新文档的id
   */
  async function addDocument(doc: Omit<Document, "id">): Promise<number> {
    error.value = null;

    try {
      const id = await dbService.addDocument(doc);

      // 添加到列表开头（最新的在前面）
      const newDoc: Document = { ...doc, id };
      documents.value.unshift(newDoc);

      return id;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "添加文档失败";
      throw e;
    }
  }

  /**
   * 删除文档
   * @param id 文档ID
   */
  async function deleteDocument(id: number): Promise<void> {
    error.value = null;

    try {
      await dbService.deleteDocument(id);

      // 从列表中移除
      const index = documents.value.findIndex((doc) => doc.id === id);
      if (index > -1) {
        documents.value.splice(index, 1);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "删除文档失败";
      throw e;
    }
  }

  /**
   * 根据ID获取文档
   * @param id 文档ID
   * @returns 文档对象或undefined
   */
  function getDocumentById(id: number): Document | undefined {
    return documents.value.find((doc) => doc.id === id);
  }

  /**
   * 清空所有文档（用于测试）
   */
  async function clearAll(): Promise<void> {
    await dbService.clearAll();
    documents.value = [];
  }

  return {
    // 状态
    documents,
    loading,
    error,
    documentCount,
    hasDocuments,

    // 方法
    loadDocuments,
    addDocument,
    deleteDocument,
    getDocumentById,
    clearAll,
  };
});
