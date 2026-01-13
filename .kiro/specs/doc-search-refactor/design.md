# Design Document: 文档智搜 Pro 重构

## Overview

本设计文档描述了将单文件HTML应用重构为模块化Vue 3项目的技术方案。项目采用业务模块化架构，将功能拆分为搜索(search)、文档库(library)、提取器(extractor)三个核心业务模块，配合通用组件、composables和服务层实现关注点分离。

### 技术栈
- Vue 3.5+ with Composition API (`<script setup>`)
- TypeScript 5.x
- Tailwind CSS v4
- Pinia 3.x (状态管理)
- Vue Router 4.x (路由)
- VueUse (工具hooks)
- Dexie (IndexedDB封装)
- lodash-es (工具函数)
- @vicons/material (图标)

## Architecture

```
src/
├── modules/                    # 业务模块
│   ├── search/                 # 搜索模块
│   │   ├── components/
│   │   │   ├── SearchBar.vue
│   │   │   ├── SearchResults.vue
│   │   │   ├── ResultCard.vue
│   │   │   ├── DocFilterModal.vue
│   │   │   └── SnippetDropdown.vue
│   │   ├── pages/
│   │   │   └── SearchView.vue
│   │   ├── composables/
│   │   │   └── useSearch.ts
│   │   └── index.ts
│   │
│   ├── library/                # 文档库模块
│   │   ├── components/
│   │   │   ├── FileUploader.vue
│   │   │   ├── FileList.vue
│   │   │   └── FileCard.vue
│   │   ├── pages/
│   │   │   └── LibraryView.vue
│   │   ├── composables/
│   │   │   └── useLibrary.ts
│   │   └── index.ts
│   │
│   └── extractor/              # 选字提取模块
│       ├── components/
│       │   ├── TextInput.vue
│       │   ├── CharGrid.vue
│       │   ├── ExtractedList.vue
│       │   └── ExtractorToolbar.vue
│       ├── pages/
│       │   └── ExtractorView.vue
│       ├── composables/
│       │   └── useExtractor.ts
│       └── index.ts
│
├── components/                 # 通用组件
│   ├── layout/
│   │   ├── NavBar.vue
│   │   └── TabBar.vue
│   ├── modal/
│   │   ├── DetailModal.vue
│   │   ├── SettingsModal.vue
│   │   └── ConfirmModal.vue
│   └── feedback/
│       └── ToastMessage.vue
│
├── composables/                # 通用hooks
│   ├── useGesture.ts           # 手势处理
│   ├── useToast.ts             # Toast消息
│   └── useConfirm.ts           # 确认弹窗
│
├── services/                   # 服务层
│   ├── db.service.ts           # IndexedDB服务
│   ├── fileParser.service.ts   # 文件解析服务
│   └── search.service.ts       # 搜索引擎服务
│
├── stores/                     # Pinia stores
│   ├── app.store.ts            # 应用配置
│   ├── document.store.ts       # 文档数据
│   └── extractor.store.ts      # 提取器状态
│
├── router/
│   └── index.ts
│
├── types/
│   └── index.ts                # 类型定义
│
├── App.vue
├── main.ts
└── style.css
```

## Components and Interfaces

### 1. 搜索引擎服务 (search.service.ts)

```typescript
interface SearchResult {
  id: number
  fileName: string
  content: string
  matchIndex: number
  matchLength: number
  highlightedSnippet: string
}

interface SearchOptions {
  maxGap: number
  isExact: boolean
  previewRange: number
}

class SearchService {
  /**
   * 执行间隔搜索
   * @param query 搜索关键词
   * @param documents 文档列表
   * @param options 搜索选项
   * @returns 排序后的搜索结果
   */
  search(query: string, documents: Document[], options: SearchOptions): SearchResult[]
  
  /**
   * 生成高亮HTML片段
   */
  highlightText(text: string, query: string, isExact: boolean): string
  
  /**
   * 查找所有匹配位置（修复精确搜索重复问题）
   */
  findMatches(content: string, query: string, options: SearchOptions): MatchInfo[]
}
```

### 2. 文件解析服务 (fileParser.service.ts)

```typescript
interface ParseResult {
  text: string
  html: string
}

class FileParserService {
  /**
   * 解析文件内容
   */
  async parseFile(file: File): Promise<ParseResult>
  
  /**
   * 解析PDF文件
   */
  private async parsePDF(file: File): Promise<ParseResult>
  
  /**
   * 解析DOCX文件
   */
  private async parseDOCX(file: File): Promise<ParseResult>
  
  /**
   * 解析TXT文件
   */
  private async parseTXT(file: File): Promise<ParseResult>
}
```

### 3. 数据库服务 (db.service.ts)

```typescript
interface Document {
  id?: number
  fileName: string
  content: string
  htmlContent: string
  date: Date
}

class DBService {
  private db: Dexie
  
  async addDocument(doc: Omit<Document, 'id'>): Promise<number>
  async getDocuments(): Promise<Document[]>
  async getDocumentById(id: number): Promise<Document | undefined>
  async deleteDocument(id: number): Promise<void>
}
```

### 4. 手势处理Hook (useGesture.ts)

```typescript
interface GestureOptions {
  threshold?: number      // 触发阈值，默认100px
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
}

function useGesture(elementRef: Ref<HTMLElement | null>, options: GestureOptions) {
  // 返回手势状态和控制方法
  return {
    isSwiping: Ref<boolean>
    swipeDistance: Ref<number>
    swipeDirection: Ref<'left' | 'right' | null>
  }
}
```

### 5. 选字提取器Hook (useExtractor.ts)

```typescript
interface ExtractedItem {
  text: string
  indices: Set<number>
  color: string
}

interface CharCell {
  char: string
  index: number
  isGrouped: boolean  // 是否为连续数字/字母组
  groupText?: string  // 组合后的文本
}

function useExtractor() {
  return {
    // 状态
    rawText: Ref<string>
    charList: ComputedRef<CharCell[]>  // 处理连续数字字母
    selectedIndices: Ref<Set<number>>
    extractedList: Ref<ExtractedItem[]>
    
    // 方法
    initSelection: () => void
    toggleIndex: (index: number, mode: boolean) => void
    handleAction: () => void
    selectAll: () => void
    invertSelection: () => void
    clearSelection: () => void
    
    // 触摸优化
    onGridTouchStart: (e: TouchEvent) => void
    onGridTouchMove: (e: TouchEvent) => void
    onGridTouchEnd: () => void
  }
}
```

## Data Models

### Document Model

```typescript
interface Document {
  id?: number
  fileName: string
  content: string        // 纯文本内容
  htmlContent: string    // HTML格式内容
  date: Date
}
```

### Search Result Model

```typescript
interface SearchResult {
  id: number
  fileName: string
  content: string
  matchIndex: number     // 匹配起始位置
  matchLength: number    // 匹配跨度长度
  highlightedSnippet: string
}
```

### Extractor State Model

```typescript
interface ExtractorState {
  currentStep: 'input' | 'select'
  innerTab: 'select' | 'list'
  rawText: string
  extractedList: ExtractedItem[]
  selectedIndices: number[]
  hideSpaces: boolean
}

interface ExtractedItem {
  text: string
  indices: number[]
  color: string
}
```

### App Config Model

```typescript
interface AppConfig {
  previewRange: number    // 预览上下文长度，默认30
  minFontSize: number     // 最小字体，默认12
  maxFontSize: number     // 最大字体，默认36
  maxSearchGap: number    // 最大搜索间隔，默认30
  detailRange: number     // 详情预览范围，默认200
  charGridWidth: number   // 字符网格宽度，默认26
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Interval Search Correctness
*For any* search query and document content, when performing interval search, all returned matches SHALL have characters appearing in the same order as the query with gaps not exceeding maxGap.
**Validates: Requirements 2.1, 2.6**

### Property 2: Exact Search Uniqueness
*For any* search query and document content, when exact search mode is enabled, the returned matches SHALL be unique (no duplicate positions) and each match SHALL be a continuous substring.
**Validates: Requirements 2.2**

### Property 3: Search Results Sorting
*For any* set of search results, the results SHALL be sorted by matchLength in ascending order (tightest matches first).
**Validates: Requirements 2.3**

### Property 4: Search Highlight Correctness
*For any* search result snippet, the highlighted HTML SHALL contain mark tags around exactly the matched character positions.
**Validates: Requirements 2.4**

### Property 5: Detail Modal Content Correctness
*For any* search result clicked, the detail modal SHALL display content from the document with the matching ID, and the content SHALL include the matched position.
**Validates: Requirements 2.5, 5.1**

### Property 6: Document Filter Correctness
*For any* document filter selection, all search results SHALL only come from documents whose IDs are in the selected set.
**Validates: Requirements 2.7**

### Property 7: File Parser Correctness
*For any* valid PDF, DOCX, or TXT file, the parser SHALL return a non-empty text string.
**Validates: Requirements 3.1**

### Property 8: Document Persistence Round-Trip
*For any* valid document object, saving to IndexedDB and then retrieving by ID SHALL return an equivalent document (same fileName, content, htmlContent).
**Validates: Requirements 3.2, 8.1**

### Property 9: Document List Sorting
*For any* set of stored documents, the library view SHALL display them sorted by date in descending order.
**Validates: Requirements 3.3**

### Property 10: Document Deletion Correctness
*For any* document ID, after deletion is confirmed, querying for that document SHALL return undefined.
**Validates: Requirements 3.5**

### Property 11: Character Grouping Correctness
*For any* input text, consecutive sequences of digits or letters SHALL be grouped into single CharCell objects with isGrouped=true and groupText containing the full sequence.
**Validates: Requirements 4.2**

### Property 12: Extraction Save Correctness
*For any* set of selected indices, clicking extract SHALL add an ExtractedItem to the list with text equal to the concatenation of characters at those indices.
**Validates: Requirements 4.4**

### Property 13: Extracted List Display Order
*For any* extracted list, the display order SHALL be the reverse of insertion order (newest items first).
**Validates: Requirements 4.5**

### Property 14: Navigation Order Correctness
*For any* navigation action (next/prev) on extracted items, the index change SHALL follow reverse order logic matching the display order.
**Validates: Requirements 4.6**

### Property 15: Selection Operations Correctness
*For any* character list:
- selectAll SHALL set selectedIndices to contain all non-space character indices
- invertSelection SHALL toggle each index's presence in selectedIndices
- clearSelection SHALL empty selectedIndices
**Validates: Requirements 4.7**

### Property 16: Extractor State Persistence Round-Trip
*For any* valid ExtractorState, saving to localStorage and then loading SHALL return an equivalent state.
**Validates: Requirements 4.8**

### Property 17: Snippet Range Correctness
*For any* matched position and detailRange, the displayed snippet SHALL be a substring of the document content centered on the matched position with length approximately 2*detailRange.
**Validates: Requirements 5.4**

### Property 18: Detail Highlight Correctness
*For any* document content and search keyword, the highlighted output SHALL contain mark tags around keyword character occurrences.
**Validates: Requirements 5.5**

### Property 19: Gesture Threshold Correctness
*For any* swipe gesture, the navigation action SHALL only trigger if the swipe distance exceeds the configured threshold.
**Validates: Requirements 6.3**

### Property 20: Config Persistence Round-Trip
*For any* valid AppConfig, saving to localStorage and then loading SHALL return an equivalent config object.
**Validates: Requirements 8.2**

## Error Handling

### File Parsing Errors
- IF a file cannot be parsed, THEN the System SHALL display an error toast and skip the file
- IF PDF.js fails to load, THEN the System SHALL fall back to displaying an error message
- IF DOCX parsing fails, THEN the System SHALL attempt to extract raw text as fallback

### Database Errors
- IF IndexedDB is unavailable, THEN the System SHALL display an error and disable document storage features
- IF a database operation fails, THEN the System SHALL display an error toast with the operation name

### Search Errors
- IF search encounters an invalid regex pattern, THEN the System SHALL escape special characters and retry
- IF search times out, THEN the System SHALL return partial results with a warning

### Gesture Errors
- IF touch events are not supported, THEN the Gesture_Handler SHALL gracefully degrade to no gesture support

## Testing Strategy

### Dual Testing Approach

本项目采用单元测试和属性测试相结合的测试策略：

**单元测试 (Vitest)**
- 测试特定示例和边界情况
- 测试组件渲染和交互
- 测试错误处理路径

**属性测试 (fast-check)**
- 验证通用属性在所有有效输入上成立
- 每个属性测试运行最少100次迭代
- 使用智能生成器约束输入空间

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Property Test Annotation Format

每个属性测试必须包含以下注释：
```typescript
/**
 * Feature: doc-search-refactor, Property N: [Property Title]
 * Validates: Requirements X.Y
 */
```

### Test File Organization

```
src/
├── modules/
│   ├── search/
│   │   └── composables/
│   │       ├── useSearch.ts
│   │       └── useSearch.test.ts
│   ├── library/
│   │   └── composables/
│   │       ├── useLibrary.ts
│   │       └── useLibrary.test.ts
│   └── extractor/
│       └── composables/
│           ├── useExtractor.ts
│           └── useExtractor.test.ts
├── services/
│   ├── search.service.ts
│   ├── search.service.test.ts
│   ├── fileParser.service.ts
│   ├── fileParser.service.test.ts
│   ├── db.service.ts
│   └── db.service.test.ts
└── composables/
    ├── useGesture.ts
    └── useGesture.test.ts
```

### Key Test Generators

```typescript
// 文档生成器
const documentArb = fc.record({
  id: fc.nat(),
  fileName: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 1, maxLength: 10000 }),
  htmlContent: fc.string(),
  date: fc.date()
})

// 搜索查询生成器
const searchQueryArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => s.trim().length > 0)

// 提取器状态生成器
const extractorStateArb = fc.record({
  currentStep: fc.constantFrom('input', 'select'),
  innerTab: fc.constantFrom('select', 'list'),
  rawText: fc.string(),
  extractedList: fc.array(fc.record({
    text: fc.string({ minLength: 1 }),
    indices: fc.array(fc.nat()),
    color: fc.hexaString()
  })),
  selectedIndices: fc.array(fc.nat()),
  hideSpaces: fc.boolean()
})
```
