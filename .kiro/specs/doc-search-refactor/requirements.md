# Requirements Document

## Introduction

本项目是一个移动端文档智能搜索应用的重构项目。需要将现有的单文件HTML应用（参考.html）拆分为规范化的Vue 3组件化项目，遵循Vue3项目开发指南中的架构原则。应用主要功能包括：智能间隔搜索、文档库管理、选字提取工具。重构需要解决现有问题（精确搜索重复、详情内容不匹配、选字列表顺序、选字卡顿、连续数字字母合并显示），并增加移动端手势支持（右滑返回）。

## Glossary

- **Search_Engine**: 搜索引擎模块，负责执行间隔搜索和精确搜索，返回高亮结果
- **Document_Store**: 文档存储模块，使用IndexedDB（Dexie）管理文档的增删查改
- **Extractor**: 选字提取模块，提供字符网格选择和提取结果管理
- **File_Parser**: 文件解析器，负责解析PDF、DOCX、TXT文件内容
- **Gesture_Handler**: 手势处理模块，处理移动端滑动手势
- **Toast_Service**: 全局消息提示服务
- **Confirm_Service**: 全局确认弹窗服务
- **App_Config**: 应用配置管理，持久化存储用户偏好设置

## Requirements

### Requirement 1: 项目架构搭建

**User Story:** As a 开发者, I want 项目按照Vue3开发指南的目录结构组织, so that 代码易于维护和扩展。

#### Acceptance Criteria

1. THE Project_Structure SHALL follow the modules-based architecture with src/modules/, src/components/, src/composables/, src/services/, src/stores/ directories
2. THE Project SHALL use Vue 3 with Composition API and `<script setup>` syntax
3. THE Project SHALL use TypeScript for type safety
4. THE Project SHALL use Tailwind CSS v4 for styling
5. THE Project SHALL use vue-router for navigation between views
6. THE Project SHALL use Pinia for global state management
7. THE Project SHALL use @vicons/material for icons instead of phosphor-icons

### Requirement 2: 搜索功能模块

**User Story:** As a 用户, I want 通过关键字搜索文档内容, so that 我能快速找到需要的信息。

#### Acceptance Criteria

1. WHEN a user enters a search query and presses Enter, THE Search_Engine SHALL perform an interval search across selected documents
2. WHEN the exact search mode is enabled, THE Search_Engine SHALL match the query as a continuous string without duplicates
3. WHEN search results are returned, THE Search_Engine SHALL sort them by match span length (tightness) in ascending order
4. WHEN displaying search results, THE System SHALL highlight matched characters in the preview snippet
5. WHEN a user clicks a search result, THE System SHALL open the detail modal showing the correct document content at the matched position
6. THE Search_Engine SHALL support configurable maximum gap between characters (default 30)
7. WHEN the user toggles document filter, THE System SHALL only search within selected documents
8. THE Search_View SHALL display extracted items pagination control when extractor has results
9. WHEN the user adjusts font size slider, THE System SHALL update preview text size in real-time

### Requirement 3: 文档库管理模块

**User Story:** As a 用户, I want 上传和管理我的文档, so that 我能建立可搜索的文档库。

#### Acceptance Criteria

1. WHEN a user selects files to upload, THE File_Parser SHALL parse PDF, DOCX, and TXT files and extract text content
2. WHEN a file is successfully parsed, THE Document_Store SHALL save the document with fileName, content, htmlContent, and date to IndexedDB
3. WHEN the library view loads, THE System SHALL display all stored documents sorted by date descending
4. WHEN a user clicks delete on a document, THE Confirm_Service SHALL show a confirmation dialog before deletion
5. WHEN deletion is confirmed, THE Document_Store SHALL remove the document from IndexedDB
6. WHEN a user clicks a document item, THE System SHALL open a preview modal showing the document content

### Requirement 4: 选字提取模块

**User Story:** As a 用户, I want 从文本中选择特定字符进行提取, so that 我能快速组合需要的文字片段。

#### Acceptance Criteria

1. WHEN a user enters text and clicks "进入选字模式", THE Extractor SHALL display characters in a grid layout
2. WHEN consecutive digits or letters appear in the text, THE Extractor SHALL group them into a single grid cell
3. WHEN a user touches and drags on the grid, THE Extractor SHALL select/deselect characters smoothly without lag
4. WHEN a user clicks "提取", THE Extractor SHALL save selected characters as an extracted item
5. WHEN displaying the extracted list, THE Extractor SHALL show items in reverse order (newest first)
6. WHEN switching between extracted items in search view, THE System SHALL reverse the navigation order to match display
7. THE Extractor SHALL support hide spaces toggle, select all, invert selection, and clear selection operations
8. THE Extractor SHALL persist extraction state to localStorage

### Requirement 5: 详情弹窗模块

**User Story:** As a 用户, I want 查看搜索结果的详细内容, so that 我能阅读完整的上下文。

#### Acceptance Criteria

1. WHEN the detail modal opens from a search result, THE System SHALL display the correct document content matching the clicked result
2. THE Detail_Modal SHALL support switching between snippet mode and full document mode
3. THE Detail_Modal SHALL support toggling between styled and plain text display
4. WHEN in snippet mode, THE System SHALL show content around the matched position with configurable range
5. THE Detail_Modal SHALL highlight search keywords in the displayed content
6. WHEN the user adjusts font size, THE System SHALL update the content display size

### Requirement 6: 移动端手势支持

**User Story:** As a 移动端用户, I want 通过滑动手势进行导航, so that 操作更加便捷自然。

#### Acceptance Criteria

1. WHEN a user swipes right on the detail modal, THE Gesture_Handler SHALL close the modal (simulating back navigation)
2. WHEN a user swipes right on sub-pages, THE Gesture_Handler SHALL navigate back to the previous view
3. THE Gesture_Handler SHALL require a minimum swipe distance threshold to trigger navigation
4. THE Gesture_Handler SHALL provide visual feedback during swipe gesture

### Requirement 7: 全局UI组件

**User Story:** As a 用户, I want 统一的交互反馈, so that 应用体验一致流畅。

#### Acceptance Criteria

1. WHEN an operation completes, THE Toast_Service SHALL display a success or error message
2. WHEN a destructive action is triggered, THE Confirm_Service SHALL show a confirmation modal
3. THE Tab_Bar SHALL provide navigation between search, library, and extractor views
4. THE Nav_Bar SHALL display the app title and settings button
5. THE Settings_Modal SHALL allow users to configure app preferences

### Requirement 8: 数据持久化

**User Story:** As a 用户, I want 我的数据和设置被保存, so that 下次打开应用时状态保持。

#### Acceptance Criteria

1. THE Document_Store SHALL persist documents to IndexedDB using Dexie
2. THE App_Config SHALL persist user preferences (font size, search gap, preview range) to localStorage using VueUse useStorage
3. THE Extractor SHALL persist extraction state (rawText, extractedList, selectedIndices) to localStorage
4. WHEN the app loads, THE System SHALL restore all persisted state

### Requirement 9: 性能优化

**User Story:** As a 用户, I want 应用响应流畅, so that 使用体验良好。

#### Acceptance Criteria

1. THE Search_Engine SHALL debounce search input to avoid excessive searches
2. THE Extractor grid SHALL use optimized touch event handling to prevent lag during character selection
3. THE System SHALL use Vue's keep-alive to cache view components
4. THE System SHALL use lodash-es for utility functions instead of custom implementations
