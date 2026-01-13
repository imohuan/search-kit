# 项目结构与架构

## 目录组织

```
src/
├── components/              # 全局共享组件
│   ├── feedback/           # Toast、通知反馈
│   ├── layout/             # NavBar、TabBar、布局包装器
│   └── modal/              # ConfirmModal、DetailModal、SettingsModal
├── composables/            # 全局组合式函数（Hooks）
│   ├── useConfirm.ts       # 确认对话框组合式
│   ├── useGesture.ts       # 滑动手势检测
│   └── useToast.ts         # Toast 通知组合式
├── modules/                # 功能模块（各自独立）
│   ├── search/             # 搜索功能模块
│   │   ├── components/     # 搜索相关组件
│   │   ├── composables/    # useSearch.ts
│   │   ├── pages/          # SearchView.vue（路由组件）
│   │   └── index.ts        # 模块导出
│   ├── library/            # 文档库功能模块
│   │   ├── components/     # FileCard、FileList、FileUploader
│   │   ├── composables/    # useLibrary.ts
│   │   └── pages/          # LibraryView.vue
│   └── extractor/          # 文本提取功能模块
│       ├── components/     # CharGrid、ExtractedList、TextInput 等
│       ├── composables/    # useExtractor.ts
│       └── pages/          # ExtractorView.vue
├── router/                 # Vue Router 配置
├── services/               # 业务逻辑与 API 层
│   ├── db.service.ts       # IndexedDB 操作（Dexie 封装）
│   ├── fileParser.service.ts # DOCX/PDF 解析
│   └── search.service.ts   # 搜索算法实现
├── stores/                 # Pinia 状态管理
│   ├── app.store.ts        # 全局应用状态
│   ├── document.store.ts   # 文档列表状态
│   └── extractor.store.ts  # 提取器状态
├── types/                  # TypeScript 类型定义
│   └── index.ts            # 所有共享类型
├── App.vue                 # 根组件
├── main.ts                 # 应用入口
└── style.css               # 全局样式（Tailwind 导入）
```

## 架构模式

### 模块结构
每个功能模块（搜索、库、提取器）遵循以下模式：
- **pages/**：路由级别组件（连接到路由）
- **components/**：模块内可复用的 UI 组件
- **composables/**：模块特定的组合式函数（useXxx）
- **index.ts**：模块的公共 API 导出

### 状态管理
- **Pinia Stores** (`src/stores/`)：全局状态（文档、应用配置、提取器状态）
- **组合式函数** (`src/composables/`)：本地状态和逻辑（useToast、useConfirm、useGesture）
- **服务层** (`src/services/`)：业务逻辑、数据获取、数据转换

### 数据流
1. 组件向 Pinia stores 分发操作或调用组合式函数
2. Stores/组合式函数调用服务进行业务逻辑处理
3. 服务与 IndexedDB（通过 Dexie）或外部 API 交互
4. 结果通过响应式状态流回组件

### 组件层级
```
App.vue (根)
├── NavBar (布局)
├── RouterView (路由特定页面)
│   └── 功能特定组件
├── TabBar (布局)
└── 全局模态框 (ToastMessage、ConfirmModal、SettingsModal)
```

## 关键约定

### 命名规范
- **组件**：PascalCase（如 `SearchBar.vue`、`FileCard.vue`）
- **组合式函数**：camelCase + use 前缀（如 `useSearch.ts`、`useToast.ts`）
- **Stores**：camelCase + .store.ts 后缀（如 `document.store.ts`）
- **Services**：camelCase + .service.ts 后缀（如 `db.service.ts`）
- **类型**：PascalCase 接口（如 `Document`、`SearchResult`）

### 文件组织
- 一个文件一个组件（除非是非常小的相关组件）
- 组合式函数是单函数导出
- 服务是基于类的，使用静态方法或单例实例
- 测试与源代码并置：`filename.test.ts` 放在 `filename.ts` 旁边

### 类型定义
- 所有共享类型在 `src/types/index.ts` 中
- 导入类型：`import type { Document, SearchResult } from '@/types'`
- 使用 TypeScript 严格模式确保类型安全

### 样式
- 使用 Tailwind CSS 功能优先的样式方法
- 组件特定样式使用 `<style scoped>` 块
- 全局样式在 `src/style.css` 中
- 不使用 CSS-in-JS 库，优先使用 Tailwind 类

### 测试
- 为服务和组合式函数编写单元测试
- 使用 Vitest + jsdom 进行 DOM 测试
- 使用 fake-indexeddb 模拟 IndexedDB
- 使用 fast-check 进行搜索算法的属性测试

## 导入路径
- 使用 `@` 别名导入 src：`import { useToast } from '@/composables'`
- 仅在同目录文件中使用相对导入
- 使用 barrel 导出（index.ts）作为模块公共 API

## 数据库架构
- **表名**：`documents`
- **索引**：`++id`（主键）、`fileName`、`date`
- **字段**：`id`、`fileName`、`content`、`htmlContent`、`date`
- 存储在名为 `DocSearchProDB` 的 IndexedDB 数据库中

## 📚 开发参考

**开发前必读：**
- 参考 `docs/Vue3项目开发指南.md` 了解架构设计原则和代码规范
- 查看 `docs/开发问题记录.md` 避免重复犯错
