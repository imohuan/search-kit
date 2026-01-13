# Design Document: UI Fidelity Refactor

## Overview

本设计文档描述文档智搜 Pro 应用的 UI 保真度重构方案。主要目标是：
1. 修复 @vicons/material 图标系统错误
2. 严格按照 `参考.html` 复刻所有 UI 组件样式
3. 实现 DOCX 文档原始样式预览功能（保留字体、颜色、背景、表格、列表等）

### 设计决策

**图标库选择**：继续使用 @vicons/material，但需要验证所有图标名称的正确性。参考 HTML 使用 Phosphor Icons，但项目已统一使用 Material Icons，因此需要找到对应的 Material 图标替代。

**样式方案**：使用 Tailwind CSS v4 实现所有样式，遵循参考 HTML 的设计规范。

**DOCX 解析**：使用 JSZip 直接解析 DOCX XML 结构，提取原始样式信息，而非依赖 mammoth 的简化输出。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   NavBar    │  │   TabBar    │  │   Global Modals     │  │
│  │  (h-14)     │  │  (h-[60px]) │  │  - SettingsModal    │  │
│  │  - Logo     │  │  - 3 tabs   │  │  - ConfirmModal     │  │
│  │  - Settings │  │  - icons    │  │  - ToastMessage     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Router View                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  SearchView  │  LibraryView  │  ExtractorView          ││
│  │  - SearchBar │  - FileUploader│  - TextInput           ││
│  │  - Results   │  - FileList   │  - CharGrid             ││
│  │  - DocFilter │  - FileCard   │  - ExtractorToolbar     ││
│  │  - DetailModal│              │  - ExtractedList        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 文件解析架构

```
┌──────────────────┐     ┌──────────────────┐
│   File Input     │────▶│  FileParser      │
│   (.docx/.pdf)   │     │  Service         │
└──────────────────┘     └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │  DOCX Parser    │         │   PDF Parser    │
          │  (JSZip + XML)  │         │   (pdfjs-dist)  │
          └────────┬────────┘         └────────┬────────┘
                   │                           │
                   ▼                           ▼
          ┌─────────────────────────────────────────────┐
          │              ParseResult                     │
          │  { text: string, html: string }             │
          │  html 包含原始样式信息                        │
          └─────────────────────────────────────────────┘
```

## Components and Interfaces

### 图标映射表

参考 HTML 使用 Phosphor Icons，需要映射到 @vicons/material：

| 功能 | Phosphor Icon | Material Icon |
|------|---------------|---------------|
| Logo | ph-read-cv-logo | ArticleOutlined |
| 设置 | ph-gear | SettingsOutlined |
| 搜索 | ph-magnifying-glass | SearchOutlined |
| 文档库 | ph-books | LibraryBooksOutlined |
| 提取 | ph-selection-plus | SelectAllOutlined |
| 筛选 | ph-funnel | FilterAltOutlined |
| 精确搜索 | ph-crosshair | GpsFixedOutlined |
| 清除 | ph-x-circle | CancelOutlined |
| 上传 | ph-upload-simple | CloudUploadOutlined |
| 文件 | ph-file-text | DescriptionOutlined |
| 删除 | ph-trash | DeleteOutlined |
| 返回 | ph-caret-down | KeyboardArrowDownOutlined |
| 剪切 | ph-scissors | ContentCutOutlined |
| 全文 | ph-book-open | MenuBookOutlined |
| 样式 | ph-paint-brush-broad | FormatPaintOutlined |
| 警告 | ph-warning-circle | WarningAmberOutlined |
| 帮助 | ph-question | HelpOutlineOutlined |
| 成功 | ph-check-circle | CheckCircleOutlined |
| 错误 | ph-warning-circle | ErrorOutlined |
| 触摸 | ph-cursor-click | TouchAppOutlined |
| 粘贴 | ph-clipboard-text | ContentPasteOutlined |
| 复制 | ph-copy | ContentCopyOutlined |

### NavBar 组件

```typescript
// src/components/layout/NavBar.vue
interface NavBarProps {
  title?: string
}

// 样式规范
// - 高度: h-14 (56px)
// - 背景: bg-white/80 backdrop-blur-md
// - 边框: border-b border-slate-200
// - 布局: flex items-center justify-between px-4
// - 定位: sticky top-0 z-20
```

### TabBar 组件

```typescript
// src/components/layout/TabBar.vue
interface TabBarProps {
  modelValue: RouteName
}

interface TabBarEmits {
  (e: 'update:modelValue', value: RouteName): void
}

// 样式规范
// - 高度: h-[60px]
// - 背景: bg-white
// - 边框: border-t border-slate-200
// - 布局: flex justify-around items-center px-2
// - 激活态: text-indigo-600 + filled icon
// - 非激活态: text-slate-400 + outlined icon
// - 交互: active:scale-95 transition-transform
```

### SearchBar 组件

```typescript
// src/modules/search/components/SearchBar.vue
interface SearchBarProps {
  modelValue: string
  isExact: boolean
  isFilterActive: boolean
}

interface SearchBarEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
  (e: 'clear'): void
  (e: 'toggle-exact'): void
  (e: 'open-filter'): void
}

// 样式规范
// - 输入框: bg-slate-100 rounded-xl py-3 pl-11 pr-24
// - 聚焦态: focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
// - 左侧筛选按钮: FilterAltOutlined
// - 右侧精确搜索: GpsFixedOutlined
// - 右侧清除按钮: CancelOutlined (仅当有内容时显示)
```

### DetailModal 组件

```typescript
// src/components/modal/DetailModal.vue
interface DetailModalProps {
  modelValue: boolean
  item: SearchResult | null
  searchKeyword: string
}

interface DetailModalEmits {
  (e: 'update:modelValue', value: boolean): void
}

// 新增状态
interface DetailModalState {
  isFullMode: boolean      // 全文/片段模式
  showOriginal: boolean    // 原版样式/纯净文本
  currentFontSize: number  // 当前字体大小
}

// 样式规范
// - 动画: slide-up transition
// - 头部: h-14 border-b border-slate-100 bg-white/90 backdrop-blur
// - 返回按钮: KeyboardArrowDownOutlined
// - 模式切换: ContentCutOutlined (片段) / MenuBookOutlined (全文)
// - 样式切换: FormatPaintOutlined
// - 内容区: doc-content-render class
```

### FileUploader 组件

```typescript
// src/modules/library/components/FileUploader.vue
interface FileUploaderEmits {
  (e: 'upload', files: FileList): void
}

// 样式规范
// - 容器: border-2 border-dashed border-slate-200 rounded-2xl h-32
// - 悬停: hover:bg-indigo-50 hover:border-indigo-300
// - 图标容器: w-10 h-10 rounded-full bg-indigo-100
// - 图标: CloudUploadOutlined text-indigo-600
```

### FileCard 组件

```typescript
// src/modules/library/components/FileCard.vue
interface FileCardProps {
  file: Document
}

interface FileCardEmits {
  (e: 'click'): void
  (e: 'delete'): void
}

// 样式规范
// - 容器: bg-white p-3 rounded-xl border border-slate-100 shadow-sm
// - 图标容器: w-10 h-10 rounded-lg bg-indigo-50
// - 图标: DescriptionOutlined text-indigo-600
// - 删除按钮: DeleteOutlined text-slate-300 hover:text-red-500
```

### ConfirmModal 组件

```typescript
// src/components/modal/ConfirmModal.vue
interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type: 'info' | 'danger'
}

// 样式规范
// - 容器: rounded-[2rem] max-w-[320px]
// - 图标容器: w-16 h-16 rounded-2xl rotate-3
// - danger 类型: bg-red-50 text-red-500, WarningAmberOutlined
// - info 类型: bg-indigo-50 text-indigo-600, HelpOutlineOutlined
// - 确认按钮 (danger): bg-red-500 shadow-red-200
// - 确认按钮 (info): bg-indigo-600 shadow-indigo-200
// - 按钮: rounded-2xl flex-1
```

### ToastMessage 组件

```typescript
// src/components/feedback/ToastMessage.vue
interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

// 样式规范
// - 定位: fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]
// - 背景: bg-slate-800/90 backdrop-blur
// - 圆角: rounded-xl
// - success 图标: CheckCircleOutlined text-green-400
// - error 图标: ErrorOutlined text-red-400
// - 自动消失: 2000ms
```

### SettingsModal 组件

```typescript
// src/components/modal/SettingsModal.vue
interface SettingsModalProps {
  modelValue: boolean
}

// 样式规范
// - 容器: rounded-2xl max-w-sm
// - 输入框: bg-slate-100 rounded-xl
// - 保存按钮: bg-indigo-600 rounded-xl
// - 配置项: previewRange, minFontSize, maxFontSize, maxSearchGap, detailRange, charGridWidth
```

## Data Models

### 扩展 ParseResult 类型

```typescript
// src/types/index.ts
export interface ParseResult {
  text: string           // 纯文本内容（用于搜索）
  html: string           // HTML 内容（包含原始样式）
  hasOriginalStyles?: boolean  // 是否包含原始样式信息
}

// DOCX 样式信息
export interface DocxRunStyle {
  color?: string         // 文字颜色 (w:color)
  highlight?: string     // 高亮颜色 (w:highlight)
  background?: string    // 背景底纹 (w:shd)
  fontSize?: number      // 字号 (w:sz)
  bold?: boolean         // 粗体 (w:b)
  italic?: boolean       // 斜体 (w:i)
}

export interface DocxParagraphStyle {
  alignment?: 'left' | 'center' | 'right' | 'justify'  // 对齐 (w:jc)
  marginLeft?: number    // 左缩进 (w:ind left)
  textIndent?: number    // 首行缩进 (w:ind firstLine)
  isList?: boolean       // 是否列表项 (w:numPr)
}
```

### 高亮颜色映射

```typescript
// DOCX 高亮颜色到 CSS 颜色的映射
const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: '#FFFF00',
  green: '#00FF00',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  blue: '#0000FF',
  red: '#FF0000',
  darkBlue: '#00008B',
  darkCyan: '#008B8B',
  darkGreen: '#006400',
  darkMagenta: '#8B008B',
  darkRed: '#8B0000',
  darkYellow: '#808000',
  darkGray: '#A9A9A9',
  lightGray: '#D3D3D3',
  black: '#000000'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Icon Import Validity

*For any* icon imported from @vicons/material in the codebase, the icon name SHALL exist as a valid export from the @vicons/material package.

**Validates: Requirements 1.1, 1.2**

### Property 2: DOCX Style Preservation Round-Trip

*For any* valid DOCX file containing styled text (color, highlight, bold, italic, font size), parsing the file SHALL produce HTML output that preserves all original style information in inline CSS.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 3: DOCX Structure Preservation

*For any* valid DOCX file containing paragraph formatting (alignment, indentation) or structural elements (tables, lists, line breaks), parsing the file SHALL produce HTML output that preserves the document structure.

**Validates: Requirements 8.6, 8.7, 8.8, 8.9, 8.10**

### Property 4: Style Toggle Behavior

*For any* document preview, when the style toggle is ON, the displayed content SHALL include original style information; when OFF, the content SHALL be plain text without inline styles.

**Validates: Requirements 8.11, 8.12**

### Property 5: Search Highlight Consistency

*For any* search keyword and document content, the highlighting SHALL work correctly in both original style mode and plain text mode.

**Validates: Requirements 8.13**

### Property 6: TabBar State Styling

*For any* tab in the TabBar, when active it SHALL display with indigo-600 color and filled icon variant; when inactive it SHALL display with slate-400 color and outlined icon variant.

**Validates: Requirements 3.3, 3.4**

### Property 7: Toast Type Icons

*For any* toast message, success type SHALL display CheckCircleOutlined in green-400, and error type SHALL display ErrorOutlined in red-400.

**Validates: Requirements 10.3, 10.4**

### Property 8: ConfirmModal Type Styling

*For any* confirm modal, danger type SHALL use red-500 background with WarningAmberOutlined icon, and info type SHALL use indigo-600 background with HelpOutlineOutlined icon.

**Validates: Requirements 9.3, 9.5**

### Property 9: Toast Auto-Dismiss

*For any* toast message displayed, it SHALL automatically dismiss after 2000ms.

**Validates: Requirements 10.5**

### Property 10: SearchBar Clear Button Visibility

*For any* SearchBar state, the clear button SHALL be visible only when the query string is non-empty.

**Validates: Requirements 4.4**

### Property 11: CharGrid Selection Styling

*For any* selected character cell in CharGrid, it SHALL have indigo-600 background with white text.

**Validates: Requirements 6.5**

## Error Handling

### 图标导入错误处理

当图标名称不存在于 @vicons/material 时：
1. 构建时 TypeScript 会报错
2. 开发者需要查找最接近的替代图标
3. 禁止使用 emoji 或文本占位符

### DOCX 解析错误处理

```typescript
// 解析失败时的降级策略
try {
  const result = await parseDocxWithStyles(file)
  return result
} catch (error) {
  console.error('DOCX style parsing failed:', error)
  // 降级到 mammoth 简单解析
  const fallbackResult = await mammoth.extractRawText({ arrayBuffer })
  return {
    text: fallbackResult.value,
    html: `<pre>${escapeHtml(fallbackResult.value)}</pre>`,
    hasOriginalStyles: false
  }
}
```

### 样式切换错误处理

当文档没有原始样式信息时：
1. 样式切换按钮应该禁用或隐藏
2. 显示提示信息告知用户该文档不支持原始样式预览

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试：

1. **DOCX 解析器测试**
   - 测试各种样式属性的提取
   - 测试表格和列表的解析
   - 测试错误处理和降级逻辑

2. **组件样式测试**
   - 使用 jsdom 验证组件渲染的 CSS 类
   - 验证条件样式的正确应用

3. **图标导入测试**
   - 验证所有使用的图标名称有效

### 属性测试

使用 fast-check 进行属性测试：

1. **Property 2 & 3: DOCX Style Preservation**
   - 生成包含各种样式的 DOCX XML 片段
   - 验证解析输出包含对应的 CSS 样式

2. **Property 4: Style Toggle**
   - 生成随机 HTML 内容
   - 验证切换行为的一致性

3. **Property 9: Toast Auto-Dismiss**
   - 验证 toast 在指定时间后消失

### 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
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

### 属性测试示例

```typescript
// src/services/fileParser.service.test.ts
import { fc } from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('DOCX Parser Properties', () => {
  // Property 2: Style Preservation
  it('should preserve text color in parsed output', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 6, maxLength: 6 }),
        (color) => {
          const xml = createDocxXmlWithColor(color)
          const result = parseDocxXml(xml)
          expect(result.html).toContain(`color: #${color}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

## Implementation Notes

### Tailwind CSS v4 注意事项

在 Vue 组件的 `<style scoped>` 中使用 `@apply` 时，需要添加：

```vue
<style scoped>
@reference "@/style.css";

.my-class {
  @apply flex items-center;
}
</style>
```

### 全局样式定义

在 `src/style.css` 中定义全局样式：

```css
/* 高亮样式 */
mark.highlight {
  background-color: theme('colors.yellow.200');
  color: theme('colors.yellow.800');
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
  border-bottom: 2px solid theme('colors.yellow.500');
}

/* 文档富文本预览样式 */
.doc-content-render {
  color: theme('colors.slate.700');
  line-height: 1.8;
  word-break: break-word;
}

.doc-content-render p {
  margin-bottom: 1em;
}

.doc-content-render table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.doc-content-render th,
.doc-content-render td {
  border: 1px solid theme('colors.slate.200');
  padding: 0.5em;
  text-align: left;
}

/* DOCX 段落样式 */
.docx-p {
  display: block;
  min-height: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.6;
  word-wrap: break-word;
}

.docx-br {
  display: block;
  content: "";
  margin-bottom: 0.3em;
}
```

### 动画定义

```css
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 底部滑入 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
```
