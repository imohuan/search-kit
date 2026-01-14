# Implementation Plan: UI Fidelity Refactor

## Overview

本实现计划将 UI 保真度重构分为三个主要阶段：
1. 图标系统修复
2. UI 组件样式复刻
3. DOCX 原始样式预览功能

## Tasks

- [x] 1. 图标系统修复
  - [x] 1.1 验证并修复所有 @vicons/material 图标导入
    - 检查所有组件中的图标导入
    - 替换不存在的图标为正确的 Material 图标
    - 确保使用 Outlined/Filled 变体正确
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. 全局样式和动画定义
  - [x] 2.1 更新 src/style.css 添加全局样式
    - 添加 mark.highlight 高亮样式
    - 添加 doc-content-render 富文本样式
    - 添加 docx-p 和 docx-br 段落样式
    - 添加 fade 和 slide-up 动画
    - _Requirements: 12.8_

- [x] 3. NavBar 组件 UI 复刻
  - [x] 3.1 重构 NavBar.vue 样式
    - 高度改为 h-14 (56px)
    - 背景改为 bg-white/80 backdrop-blur-md
    - 添加 Pro badge 样式
    - 使用 ArticleOutlined 作为 logo 图标
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [-] 4. TabBar 组件 UI 复刻
  - [x] 4.1 重构 TabBar.vue 样式
    - 高度改为 h-[60px]
    - 实现激活/非激活态图标切换 (Filled/Outlined)
    - 使用正确的 Material 图标
    - 添加 active:scale-95 交互效果
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 4.2 编写 TabBar 状态样式属性测试
    - **Property 6: TabBar State Styling**
    - **Validates: Requirements 3.3, 3.4**

- [-] 5. SearchView UI 复刻
  - [x] 5.1 重构 SearchBar.vue 样式
    - 输入框样式: bg-slate-100 rounded-xl
    - 添加左侧筛选按钮 FilterAltOutlined
    - 添加精确搜索按钮 GpsFixedOutlined
    - 添加清除按钮 CancelOutlined
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 5.2 编写 SearchBar 清除按钮可见性属性测试
    - **Property 10: SearchBar Clear Button Visibility**
    - **Validates: Requirements 4.4**
  - [x] 5.3 重构 SearchResults 卡片样式
    - 卡片样式: bg-white rounded-xl border-slate-100
    - 添加匹配跨度 badge
    - _Requirements: 4.5, 4.6_
  - [x] 5.4 重构底部工具栏样式
    - 分页控件、字体滑块、剪切板按钮
    - _Requirements: 4.7_
  - [x] 5.5 重构 DocFilterModal 样式
    - 底部弹窗样式 rounded-t-3xl
    - _Requirements: 4.8_

- [x] 6. LibraryView UI 复刻
  - [x] 6.1 重构 FileUploader.vue 样式
    - 虚线边框: border-2 border-dashed border-slate-200 rounded-2xl
    - 上传图标: CloudUploadOutlined in indigo-100 circle
    - _Requirements: 5.1, 5.2_
  - [x] 6.2 重构 FileCard.vue 样式
    - 卡片样式: bg-white rounded-xl border-slate-100
    - 文件图标: DescriptionOutlined in indigo-50 square
    - 删除按钮: DeleteOutlined
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [-] 7. ExtractorView UI 复刻
  - [x] 7.1 重构 TextInput.vue 样式
    - 文本区域: border-slate-200 rounded-md shadow-inner
    - 按钮图标: TouchAppOutlined, ContentPasteOutlined
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 重构 CharGrid.vue 样式
    - flex-wrap 布局 gap-1
    - 选中态: bg-indigo-600 text-white
    - _Requirements: 6.4, 6.5_
  - [ ]* 7.3 编写 CharGrid 选中样式属性测试
    - **Property 11: CharGrid Selection Styling**
    - **Validates: Requirements 6.5**
  - [x] 7.4 重构 ExtractorToolbar.vue 样式
    - 工具按钮布局和图标
    - _Requirements: 6.6_
  - [x] 7.5 重构 ExtractedList.vue 样式
    - 列表项序号 badge 和颜色指示器
    - _Requirements: 6.7_

- [x] 8. Checkpoint - UI 组件样式验证
  - 确保所有组件样式与参考.html 一致
  - 运行现有测试确保无回归
  - 询问用户是否有问题

- [x] 9. DetailModal UI 复刻
  - [x] 9.1 重构 DetailModal.vue 样式和功能
    - slide-up 动画
    - 头部样式: h-14 border-b border-slate-100 bg-white/90 backdrop-blur
    - 返回按钮: KeyboardArrowDownOutlined
    - 字体滑块
    - 模式切换按钮: ContentCutOutlined / MenuBookOutlined
    - 样式切换按钮: FormatPaintOutlined
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 10. ConfirmModal UI 复刻
  - [x] 10.1 重构 ConfirmModal.vue 样式
    - 容器: rounded-[2rem] max-w-[320px]
    - 图标容器: w-16 h-16 rounded-2xl rotate-3
    - danger/info 类型样式区分
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]* 10.2 编写 ConfirmModal 类型样式属性测试
    - **Property 8: ConfirmModal Type Styling**
    - **Validates: Requirements 9.3, 9.5**

- [x] 11. ToastMessage UI 复刻
  - [x] 11.1 重构 ToastMessage.vue 样式
    - 居中定位: top-1/2 left-1/2 -translate
    - 背景: bg-slate-800/90 backdrop-blur
    - success/error 图标区分
    - 2秒自动消失
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 11.2 编写 Toast 类型图标属性测试
    - **Property 7: Toast Type Icons**
    - **Validates: Requirements 10.3, 10.4**
  - [ ]* 11.3 编写 Toast 自动消失属性测试
    - **Property 9: Toast Auto-Dismiss**
    - **Validates: Requirements 10.5**

- [x] 12. SettingsModal UI 复刻
  - [x] 12.1 重构 SettingsModal.vue 样式
    - 容器: rounded-2xl max-w-sm
    - 输入框: bg-slate-100 rounded-xl
    - 保存按钮: bg-indigo-600 rounded-xl
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 13. Checkpoint - Modal 组件验证
  - 确保所有弹窗组件样式正确
  - 运行测试确保无回归
  - 询问用户是否有问题

- [x] 14. DOCX 原始样式解析功能
  - [x] 14.1 添加 JSZip 依赖并创建 DOCX 样式解析器
    - 安装 jszip 包
    - 创建 src/services/docxStyleParser.service.ts
    - 实现 XML 解析和样式提取
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 14.2 编写 DOCX 样式保留属性测试
    - **Property 2: DOCX Style Preservation Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  - [x] 14.3 实现段落格式和结构元素解析
    - 对齐、缩进
    - 表格、列表
    - 换行符
    - _Requirements: 8.6, 8.7, 8.8, 8.9, 8.10_
  - [ ]* 14.4 编写 DOCX 结构保留属性测试
    - **Property 3: DOCX Structure Preservation**
    - **Validates: Requirements 8.6, 8.7, 8.8, 8.9, 8.10**
  - [x] 14.5 更新 fileParser.service.ts 集成新解析器
    - 替换 mammoth 为 JSZip 解析
    - 实现降级逻辑
    - _Requirements: 8.1-8.10_

- [x] 15. 文档预览样式切换功能
  - [x] 15.1 更新 Document 类型添加 hasOriginalStyles 字段
    - 更新 src/types/index.ts
    - 更新数据库 schema
    - _Requirements: 8.11, 8.12_
  - [x] 15.2 实现 DetailModal 样式切换逻辑
    - showOriginal 状态管理
    - 原版样式/纯净文本切换
    - _Requirements: 8.11, 8.12_
  - [ ]* 15.3 编写样式切换行为属性测试
    - **Property 4: Style Toggle Behavior**
    - **Validates: Requirements 8.11, 8.12**
  - [x] 15.4 实现搜索高亮在两种模式下的兼容
    - 原版样式模式高亮
    - 纯净文本模式高亮
    - _Requirements: 8.13_
  - [ ]* 15.5 编写搜索高亮一致性属性测试
    - **Property 5: Search Highlight Consistency**
    - **Validates: Requirements 8.13**

- [-] 16. Checkpoint - DOCX 解析功能验证
  - 使用测试文件验证样式解析
  - 运行所有属性测试
  - 询问用户是否有问题

- [ ] 17. 最终集成和验证
  - [ ] 17.1 全局样式规范验证
    - 验证 slate 颜色使用
    - 验证 indigo 颜色使用
    - 验证圆角规范 (rounded-xl, rounded-2xl)
    - 验证阴影规范 (shadow-sm, shadow-2xl)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  - [ ] 17.2 运行完整测试套件
    - 运行 pnpm run test
    - 确保所有测试通过
  - [ ] 17.3 构建验证
    - 运行 pnpm run build
    - 确保无构建错误

- [ ] 18. Final Checkpoint - 完成验收
  - 确保所有任务完成
  - 确保所有测试通过
  - 询问用户进行最终验收

## Notes

- 标记 `*` 的任务为可选测试任务，可跳过以加快 MVP 开发
- 每个 Checkpoint 用于阶段性验证，确保增量开发质量
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
