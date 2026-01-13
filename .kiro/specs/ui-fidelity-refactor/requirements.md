# Requirements Document

## Introduction

本项目是对文档智搜 Pro 应用的 UI 保真度重构和功能完善。目标是严格按照 `参考.html` 的设计实现 UI 样式，修复图标系统问题，并补充缺失的文档原始样式预览功能。主要解决以下问题：
1. 图标系统错误 - 修复 @vicons/material 图标导入错误（使用正确的图标名称如 `XxxOutlined`）
2. UI 样式偏差 - 需要严格复刻参考.html 的组件样式
3. 文档预览功能缺失 - 需要实现 DOCX/PDF 原始样式预览（字体、颜色、背景、表格、列表等）

## Glossary

- **Material_Icons**: 项目使用的图标库 @vicons/material，通过 Vue 组件方式使用。图标命名规范为 `XxxOutlined`（线框）、`XxxFilled`（填充）、`XxxRound`（圆角）等
- **Document_Preview**: 文档预览模块，支持显示原始样式（字体、颜色、背景）和纯净文本两种模式
- **DOCX_Parser**: DOCX 文件解析器，需要保留原始样式信息（颜色、高亮、字号、粗体、斜体、表格、列表）
- **Style_Toggle**: 样式切换功能，在原版样式和纯净文本之间切换
- **UI_Component**: 遵循参考.html 设计规范的 Vue 组件

## Requirements

### Requirement 1: 图标系统修复

**User Story:** As a 开发者, I want 修复 @vicons/material 图标导入错误, so that 图标显示正确且应用能正常运行。

#### Acceptance Criteria

1. THE System SHALL use @vicons/material for all icons
2. THE System SHALL only import icons that exist in @vicons/material package
3. WHEN an icon name does not exist in @vicons/material, THE System SHALL use the closest equivalent icon
4. THE System SHALL NOT use emoji-style text icons or placeholder text
5. THE Icon imports SHALL be verified against @vicons/material package exports before use

### Requirement 2: NavBar 组件 UI 复刻

**User Story:** As a 用户, I want 顶部导航栏与参考设计完全一致, so that 应用外观专业统一。

#### Acceptance Criteria

1. THE NavBar SHALL have height of 56px (h-14) with white/80 background and backdrop blur
2. THE NavBar SHALL display app title "文档智搜" with "Pro" badge in indigo-100 background
3. THE NavBar SHALL use appropriate Material icon for the logo (e.g., ArticleOutlined or similar)
4. THE NavBar SHALL have a settings button using Settings icon on the right
5. THE NavBar SHALL have bottom border in slate-200 color

### Requirement 3: TabBar 组件 UI 复刻

**User Story:** As a 用户, I want 底部导航栏与参考设计完全一致, so that 导航体验流畅。

#### Acceptance Criteria

1. THE TabBar SHALL have height of 60px with white background and top border
2. THE TabBar SHALL display three tabs: 智能搜索, 文档库, 选字提取
3. WHEN a tab is active, THE TabBar SHALL show filled icon variant and indigo-600 color
4. WHEN a tab is inactive, THE TabBar SHALL show outline icon variant and slate-400 color
5. THE TabBar icons SHALL use Material icons: SearchOutlined (搜索), LibraryBooksOutlined (文档库), SelectAllOutlined (提取)
6. THE TabBar SHALL support active:scale-95 transition on tap

### Requirement 4: SearchView UI 复刻

**User Story:** As a 用户, I want 搜索界面与参考设计完全一致, so that 搜索体验直观高效。

#### Acceptance Criteria

1. THE SearchBar SHALL have slate-100 background with rounded-xl border radius
2. THE SearchBar SHALL have document filter button on the left using FilterAltOutlined icon
3. THE SearchBar SHALL have exact search toggle button using GpsFixedOutlined icon
4. THE SearchBar SHALL have clear button using CancelOutlined icon when query exists
5. THE SearchResults cards SHALL have white background, rounded-xl, slate-100 border
6. THE SearchResults SHALL display match span length badge in indigo-50 background
7. THE Bottom toolbar SHALL include pagination controls, font size slider, and clipboard button
8. THE DocFilterModal SHALL use bottom sheet style with rounded-t-3xl corners

### Requirement 5: LibraryView UI 复刻

**User Story:** As a 用户, I want 文档库界面与参考设计完全一致, so that 文档管理清晰直观。

#### Acceptance Criteria

1. THE FileUploader SHALL have dashed border-2 with slate-200 color and rounded-2xl
2. THE FileUploader SHALL show upload icon CloudUploadOutlined in indigo-100 circle
3. THE FileCard SHALL have white background, rounded-xl, slate-100 border
4. THE FileCard SHALL display file icon DescriptionOutlined in indigo-50 square
5. THE FileCard SHALL show delete button using DeleteOutlined icon
6. THE FileCard SHALL display file name, date, and content size

### Requirement 6: ExtractorView UI 复刻

**User Story:** As a 用户, I want 选字提取界面与参考设计完全一致, so that 文字提取操作便捷。

#### Acceptance Criteria

1. THE TextInput area SHALL have slate-200 border with rounded-md and shadow-inner
2. THE TextInput SHALL have "进入选字模式" button with TouchAppOutlined icon
3. THE TextInput SHALL have "粘贴" button with ContentPasteOutlined icon
4. THE CharGrid SHALL display characters in flex-wrap layout with gap-1 spacing
5. THE CharGrid selected cells SHALL have indigo-600 background with white text
6. THE ExtractorToolbar SHALL include hide spaces, clear symbols, select all, invert, clear buttons
7. THE ExtractedList items SHALL show item number badge with color indicator

### Requirement 7: DetailModal UI 复刻

**User Story:** As a 用户, I want 详情弹窗与参考设计完全一致, so that 文档阅读体验舒适。

#### Acceptance Criteria

1. THE DetailModal SHALL slide up from bottom with slide-up transition
2. THE DetailModal header SHALL have back button using KeyboardArrowDownOutlined icon
3. THE DetailModal SHALL have font size slider in header area
4. THE DetailModal SHALL have mode toggle button (snippet/full) using ContentCutOutlined / MenuBookOutlined icons
5. THE DetailModal SHALL have style toggle button using FormatPaintOutlined icon
6. THE DetailModal content SHALL use doc-content-render class for rich text styling

### Requirement 8: 文档原始样式预览功能

**User Story:** As a 用户, I want 预览文档的原始样式（字体、颜色、背景、表格等）, so that 我能看到文档的真实排版。

#### Acceptance Criteria

1. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve text color (w:color)
2. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve highlight color (w:highlight)
3. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve background shading (w:shd)
4. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve font size (w:sz)
5. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve bold (w:b) and italic (w:i) styles
6. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve paragraph alignment (w:jc)
7. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve paragraph indentation (w:ind)
8. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve tables (w:tbl) with cell borders
9. WHEN parsing DOCX files, THE DOCX_Parser SHALL extract and preserve list formatting (w:numPr)
10. WHEN parsing DOCX files, THE DOCX_Parser SHALL handle line breaks (w:br) correctly
11. WHEN the style toggle is ON, THE Document_Preview SHALL display content with original styles
12. WHEN the style toggle is OFF, THE Document_Preview SHALL display plain text without styles
13. THE Document_Preview SHALL support search keyword highlighting in both modes

### Requirement 9: ConfirmModal UI 复刻

**User Story:** As a 用户, I want 确认弹窗与参考设计完全一致, so that 交互反馈清晰明确。

#### Acceptance Criteria

1. THE ConfirmModal SHALL have rounded-[2rem] corners with max-w-[320px]
2. THE ConfirmModal SHALL display icon in 16x16 rounded-2xl container with rotate-3 effect
3. THE ConfirmModal SHALL use WarningAmberOutlined for danger type and HelpOutlineOutlined for info type
4. THE ConfirmModal buttons SHALL have rounded-2xl with flex-1 layout
5. THE ConfirmModal danger button SHALL have red-500 background with shadow-red-200

### Requirement 10: ToastMessage UI 复刻

**User Story:** As a 用户, I want Toast 消息与参考设计完全一致, so that 操作反馈及时明显。

#### Acceptance Criteria

1. THE ToastMessage SHALL be positioned at center of screen (top-1/2 left-1/2 -translate)
2. THE ToastMessage SHALL have slate-800/90 background with backdrop-blur
3. THE ToastMessage SHALL display success icon CheckCircleOutlined in green-400
4. THE ToastMessage SHALL display error icon ErrorOutlined in red-400
5. THE ToastMessage SHALL auto-dismiss after 2 seconds

### Requirement 11: SettingsModal UI 复刻

**User Story:** As a 用户, I want 设置弹窗与参考设计完全一致, so that 配置操作简单直观。

#### Acceptance Criteria

1. THE SettingsModal SHALL have rounded-2xl corners with max-w-sm width
2. THE SettingsModal input fields SHALL have slate-100 background with rounded-xl
3. THE SettingsModal SHALL display all config options: 预览字数, 字体范围, 搜索间距, 详情范围, 选字格宽度
4. THE SettingsModal save button SHALL have indigo-600 background with rounded-xl

### Requirement 12: 全局样式规范

**User Story:** As a 开发者, I want 统一的样式规范, so that 所有组件风格一致。

#### Acceptance Criteria

1. THE System SHALL use slate color palette for neutral colors (50-900)
2. THE System SHALL use indigo color palette for primary/accent colors (50-700)
3. THE System SHALL use rounded-xl (12px) for cards and buttons
4. THE System SHALL use rounded-2xl (16px) for modals and large containers
5. THE System SHALL use shadow-sm for cards and shadow-2xl for modals
6. THE System SHALL use transition-all for smooth state changes
7. THE System SHALL use active:scale-[0.98] or active:scale-95 for button press feedback
8. THE highlight mark SHALL use yellow-200 background with yellow-800 text and yellow border-bottom

