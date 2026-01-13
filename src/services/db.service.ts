/**
 * 数据库服务 - 使用 Dexie 封装 IndexedDB 操作
 * Requirements: 3.2, 8.1
 */

import Dexie, { type Table } from 'dexie'
import type { Document } from '@/types'

/**
 * 文档数据库类
 */
class DocumentDatabase extends Dexie {
  documents!: Table<Document, number>

  constructor() {
    super('DocSearchProDB')
    this.version(1).stores({
      documents: '++id, fileName, date',
    })
  }
}

/**
 * 数据库服务类
 */
class DBService {
  private db: DocumentDatabase

  constructor() {
    this.db = new DocumentDatabase()
  }

  /**
   * 添加文档到数据库
   * @param doc 文档对象（不含id）
   * @returns 新文档的id
   */
  async addDocument(doc: Omit<Document, 'id'>): Promise<number> {
    const id = await this.db.documents.add({
      ...doc,
      date: doc.date instanceof Date ? doc.date : new Date(doc.date),
    })
    return id
  }

  /**
   * 获取所有文档
   * @returns 文档列表，按日期降序排列
   */
  async getDocuments(): Promise<Document[]> {
    const documents = await this.db.documents.orderBy('date').reverse().toArray()
    return documents
  }

  /**
   * 根据ID获取文档
   * @param id 文档ID
   * @returns 文档对象或undefined
   */
  async getDocumentById(id: number): Promise<Document | undefined> {
    return await this.db.documents.get(id)
  }

  /**
   * 删除文档
   * @param id 文档ID
   */
  async deleteDocument(id: number): Promise<void> {
    await this.db.documents.delete(id)
  }

  /**
   * 清空所有文档（用于测试）
   */
  async clearAll(): Promise<void> {
    await this.db.documents.clear()
  }
}

// 导出单例实例
export const dbService = new DBService()

// 导出类用于测试
export { DBService, DocumentDatabase }
