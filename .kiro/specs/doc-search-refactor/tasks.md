# Implementation Plan: 文档智搜 Pro 重构

## Overview

本实现计划将单文件HTML应用重构为模块化Vue 3项目。采用渐进式实现策略，先搭建基础架构，再逐步实现各业务模块，最后添加手势支持和优化。

## Tasks

- [x] 1. 项目基础架构搭建
  - [x] 1.1 创建目录结构和基础配置
    - 创建 src/modules/, src/components/, src/composables/, src/services/, src/stores/, src/types/, src/router/ 目录
    - 配置 TypeScript 路径别名 (@/)
    - 安装依赖: dexie, mammoth, pdfjs-dist, fast-check, vitest
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 创建类型定义文件
    - 创建 src/types/index.ts 定义 Document, SearchResult, ExtractorState, AppConfig 等类型
    - _Requirements: 1.3_
  - [x] 1.3 配置路由和Pinia
    - 创建 src/router/index.ts 配置三个主视图路由
    - 创建 src/stores/app.store.ts 管理应用配置
    - _Requirements: 1.5, 1.6_

- [-] 2. 通用服务层实现
  - [x] 2.1 实现数据库服务 (db.service.ts)
    - 使用 Dexie 封装 IndexedDB 操作
    - 实现 addDocument, getDocuments, getDocumentById, deleteDocument 方法
    - _Requirements: 3.2, 8.1_
  - [x] 2.2 编写数据库服务属性测试

    - **Property 8: Document Persistence Round-Trip**
    - **Validates: Requirements 3.2, 8.1**
  - [x] 2.3 实现文件解析服务 (fileParser.service.ts)
    - 实现 PDF 解析 (pdfjs-dist)
    - 实现 DOCX 解析 (mammoth)
    - 实现 TXT 解析
    - _Requirements: 3.1_
  - [x] 2.4 编写文件解析服务属性测试

    - **Property 7: File Parser Correctness**
    - **Validates: Requirements 3.1**
  - [x] 2.5 实现搜索引擎服务 (search.service.ts)
    - 实现间隔搜索算法
    - 实现精确搜索算法（修复重复问题）
    - 实现高亮文本生成
    - 实现结果排序（按紧密度）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  - [x] 2.6 编写搜索引擎属性测试

    - **Property 1: Interval Search Correctness**
    - **Property 2: Exact Search Uniqueness**
    - **Property 3: Search Results Sorting**
    - **Property 4: Search Highlight Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

- [x] 3. Checkpoint - 服务层测试通过
  - 确保所有服务层测试通过，如有问题请询问用户

- [x] 4. 通用组件和Composables实现
  - [x] 4.1 实现Toast服务 (useToast.ts)
    - 创建 src/composables/useToast.ts
    - 创建 src/components/feedback/ToastMessage.vue
    - _Requirements: 7.1_
  - [x] 4.2 实现确认弹窗服务 (useConfirm.ts)
    - 创建 src/composables/useConfirm.ts
    - 创建 src/components/modal/ConfirmModal.vue
    - _Requirements: 7.2_
  - [x] 4.3 实现布局组件
    - 创建 src/components/layout/NavBar.vue
    - 创建 src/components/layout/TabBar.vue
    - 使用 @vicons/material 图标
    - _Requirements: 7.3, 7.4, 1.7_
  - [x] 4.4 实现手势处理Hook (useGesture.ts)
    - 创建 src/composables/useGesture.ts
    - 实现触摸滑动检测
    - 实现阈值判断和方向识别
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 4.5 编写手势处理属性测试

    - **Property 19: Gesture Threshold Correctness**
    - **Validates: Requirements 6.3**

- [-] 5. 文档库模块实现
  - [x] 5.1 创建文档Store (document.store.ts)
    - 创建 src/stores/document.store.ts
    - 管理文档列表状态
    - 实现加载、添加、删除操作
    - _Requirements: 3.2, 3.3, 3.5_
  - [x] 5.2 实现文档库Composable (useLibrary.ts)
    - 创建 src/modules/library/composables/useLibrary.ts
    - 封装文件上传、解析、存储逻辑
    - _Requirements: 3.1, 3.2_
  - [x] 5.3 实现文档库组件
    - 创建 FileUploader.vue (拖拽上传区域)
    - 创建 FileCard.vue (文档卡片)
    - 创建 FileList.vue (文档列表)
    - _Requirements: 3.3, 3.6_
  - [x] 5.4 实现文档库页面 (LibraryView.vue)
    - 创建 src/modules/library/pages/LibraryView.vue
    - 组合上传区域和文件列表
    - _Requirements: 3.3, 3.4, 3.5, 3.6_
  - [x] 5.5 编写文档库属性测试

    - **Property 9: Document List Sorting**
    - **Property 10: Document Deletion Correctness**
    - **Validates: Requirements 3.3, 3.5**

- [x] 6. Checkpoint - 文档库功能测试通过
  - 确保文档库模块测试通过，如有问题请询问用户

- [x] 7. 搜索模块实现
  - [x] 7.1 实现搜索Composable (useSearch.ts)
    - 创建 src/modules/search/composables/useSearch.ts
    - 封装搜索逻辑、结果管理、文档筛选
    - 集成提取器分页控制
    - _Requirements: 2.1, 2.2, 2.7, 2.8_
  - [x] 7.2 实现搜索组件
    - 创建 SearchBar.vue (搜索框、精确搜索切换)
    - 创建 ResultCard.vue (结果卡片)
    - 创建 SearchResults.vue (结果列表)
    - 创建 DocFilterModal.vue (文档筛选弹窗)
    - 创建 SnippetDropdown.vue (提取项选择弹窗)
    - _Requirements: 2.1, 2.4, 2.7, 2.8, 2.9_
  - [x] 7.3 实现搜索页面 (SearchView.vue)
    - 创建 src/modules/search/pages/SearchView.vue
    - 组合搜索框、结果列表、底部工具栏
    - _Requirements: 2.1-2.9_
  - [ ]* 7.4 编写搜索模块属性测试
    - **Property 6: Document Filter Correctness**
    - **Validates: Requirements 2.7**

- [x] 8. 详情弹窗实现
  - [x] 8.1 实现详情弹窗组件 (DetailModal.vue)
    - 创建 src/components/modal/DetailModal.vue
    - 实现全文/片段模式切换
    - 实现原版/纯净样式切换
    - 实现关键词高亮
    - 实现字体大小调节
    - 修复内容不匹配问题
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 8.2 集成右滑关闭手势
    - 在 DetailModal 中使用 useGesture
    - 实现滑动关闭效果
    - _Requirements: 6.1_
  - [ ]* 8.3 编写详情弹窗属性测试
    - **Property 5: Detail Modal Content Correctness**
    - **Property 17: Snippet Range Correctness**
    - **Property 18: Detail Highlight Correctness**
    - **Validates: Requirements 2.5, 5.1, 5.4, 5.5**

- [ ] 9. Checkpoint - 搜索和详情功能测试通过
  - 确保搜索模块和详情弹窗测试通过，如有问题请询问用户

- [x] 10. 选字提取模块实现
  - [x] 10.1 创建提取器Store (extractor.store.ts)
    - 创建 src/stores/extractor.store.ts
    - 管理提取器状态持久化
    - _Requirements: 4.8, 8.3_
  - [x] 10.2 实现提取器Composable (useExtractor.ts)
    - 创建 src/modules/extractor/composables/useExtractor.ts
    - 实现字符列表生成（连续数字字母合并）
    - 实现触摸选择逻辑（优化卡顿）
    - 实现提取、编辑、删除操作
    - 实现列表顺序反转
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 10.3 编写提取器属性测试
    - **Property 11: Character Grouping Correctness**
    - **Property 12: Extraction Save Correctness**
    - **Property 13: Extracted List Display Order**
    - **Property 14: Navigation Order Correctness**
    - **Property 15: Selection Operations Correctness**
    - **Property 16: Extractor State Persistence Round-Trip**
    - **Validates: Requirements 4.2, 4.4, 4.5, 4.6, 4.7, 4.8**
  - [x] 10.4 实现提取器组件
    - 创建 TextInput.vue (文本输入区域)
    - 创建 CharGrid.vue (字符网格，优化触摸性能)
    - 创建 ExtractedList.vue (提取结果列表)
    - 创建 ExtractorToolbar.vue (工具栏)
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  - [x] 10.5 实现提取器页面 (ExtractorView.vue)
    - 创建 src/modules/extractor/pages/ExtractorView.vue
    - 组合输入模式和选字模式
    - _Requirements: 4.1-4.8_

- [ ] 11. Checkpoint - 提取器功能测试通过
  - 确保提取器模块测试通过，如有问题请询问用户

- [x] 12. 应用集成和设置
  - [x] 12.1 实现设置弹窗 (SettingsModal.vue)
    - 创建 src/components/modal/SettingsModal.vue
    - 实现配置项编辑
    - _Requirements: 7.5_
  - [x] 12.2 实现主应用组件 (App.vue)
    - 集成 NavBar, TabBar, 路由视图
    - 集成全局弹窗 (Toast, Confirm, Detail, Settings)
    - _Requirements: 7.3, 7.4_
  - [x] 12.3 配置应用入口 (main.ts)
    - 注册 Pinia, Router
    - 配置全局样式
    - _Requirements: 1.5, 1.6_
  - [ ]* 12.4 编写配置持久化属性测试
    - **Property 20: Config Persistence Round-Trip**
    - **Validates: Requirements 8.2**

- [x] 13. 样式和优化
  - [x] 13.1 迁移全局样式
    - 将参考文件中的自定义样式迁移到 src/style.css
    - 配置 Tailwind CSS v4
    - _Requirements: 1.4_
  - [x] 13.2 性能优化
    - 配置 keep-alive 缓存视图组件
    - 优化搜索防抖
    - 优化触摸事件处理
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 14. Final Checkpoint - 全部测试通过
  - 运行完整测试套件
  - 确保所有属性测试和单元测试通过
  - 如有问题请询问用户


## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快MVP开发
- 每个任务引用具体的需求条款以保证可追溯性
- Checkpoint任务用于阶段性验证，确保增量开发质量
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
