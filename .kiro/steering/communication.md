# 中文原生协议 - 文档智搜 Pro 项目版

## 一、核心原则

作为文档智搜 Pro 项目的 AI 助手，我遵循**中文优先**的沟通原则。所有技术讨论、代码审查、问题分析都使用中文进行。

---

## 二、语言规则

### 2.1 输出语言
- **所有解释、分析、建议**：使用中文
- **技术术语**：保留英文（如 Vue 3、TypeScript、Pinia、IndexedDB、API 等）
- **代码相关**：保持英文（变量名、函数名、文件路径、CLI 命令）

### 2.2 示例
✅ **正确做法**
- "检查 `useSearch.ts` 中的搜索逻辑"
- "这个 `ref` 需要添加类型注解"
- "运行 `pnpm run lint:format` 检查代码"
- "在 `src/modules/search/components/SearchBar.vue` 中修改样式"

❌ **错误做法**
- "Let me check the search logic"
- "I'll analyze the component structure"
- "检查 search logic"（混合语言）

### 2.3 代码注释规范
- 新代码的注释必须使用**中文**
- 保持注释简洁明了
- 示例：
  ```typescript
  // 检查搜索关键词是否为空
  if (!keyword.trim()) {
    return []
  }
  
  // 执行全文搜索
  const results = await searchService.search(keyword, options)
  ```

### 2.4 Git 提交信息
- 格式：`<类型>: <中文描述>`
- 类型：feat（功能）、fix（修复）、refactor（重构）、docs（文档）、test（测试）
- 示例：
  - `feat: 添加文档搜索功能`
  - `fix: 修复 Tailwind CSS @apply 兼容性问题`
  - `refactor: 优化搜索算法性能`
  - `docs: 更新开发指南`

---

## 三、项目上下文

### 3.1 必读文档（优先级顺序）
1. **docs/Vue3项目开发指南.md** ⭐ 最重要
   - 项目架构设计原则
   - 代码编写规范
   - 开发决策 Checklist

2. **docs/开发问题记录.md** ⭐ 重要
   - 已知问题和解决方案
   - 避免重复犯错

3. **.kiro/steering/structure.md**
   - 项目目录结构
   - 命名约定
   - 架构模式

4. **.kiro/steering/tech.md**
   - 技术栈详情
   - 常用命令
   - 构建配置

### 3.2 项目特点
- **前端框架**：Vue 3 + TypeScript + Composition API
- **构建工具**：Vite 8.0.0-beta.0
- **状态管理**：Pinia
- **样式**：Tailwind CSS v4（注意 @apply 需要 @reference）
- **数据库**：IndexedDB（通过 Dexie 封装）
- **文档处理**：mammoth（DOCX）、pdfjs-dist（PDF）

---

## 四、开发规范

### 4.1 任务规划
- 制定计划时使用**中文**标题和步骤说明
- 示例：
  ```
  ## 实现文档上传功能
  
  ### 步骤 1：创建上传组件
  - 在 `src/modules/library/components/` 下创建 `FileUploader.vue`
  - 实现文件选择和验证逻辑
  
  ### 步骤 2：集成到库管理模块
  - 在 `LibraryView.vue` 中引入上传组件
  - 处理上传成功/失败的回调
  ```

### 4.2 代码审查
- 检查代码时使用中文说明问题
- 提供改进建议时用中文解释原因
- 示例：
  ```
  问题：这个组件超过 200 行，需要拆分
  建议：将搜索结果展示逻辑提取到 `ResultCard.vue` 组件
  原因：遵循单一职责原则，提高代码可维护性
  ```

### 4.3 文档编写
- 技术文档使用中文
- 保持 Markdown 格式规范
- 代码示例中的注释使用中文

### 4.4 问题排查
- 分析问题时用中文说明思路
- 提供解决方案时解释原因
- 记录解决方案到 `docs/开发问题记录.md`

---

## 五、工作模式

### 5.1 复杂任务（如新功能开发）
1. 阅读相关规范文档（Vue3项目开发指南、开发问题记录）
2. 制定详细计划（中文标题和步骤）
3. 逐步实现并验证
4. 完成后更新相关文档

### 5.2 简单任务（如修复 Bug、小改动）
1. 直接执行
2. 保持代码风格一致
3. 提供中文说明

### 5.3 不确定时
- 主动询问而非猜测
- 提供多个选项让用户决策
- 解释每个选项的优缺点

---

## 六、特殊注意事项

### 6.1 Tailwind CSS v4 使用
- 在 Vue 组件的 `<style scoped>` 中使用 `@apply` 时，必须添加：
  ```vue
  <style scoped>
  @reference "@/style.css";
  
  .my-class {
    @apply flex items-center;
  }
  </style>
  ```
- 详见 `docs/开发问题记录.md` 中的问题 1

### 6.2 模块结构
- 新功能必须遵循模块化结构
- 参考 `docs/Vue3项目开发指南.md` 中的目录结构决策树
- 不确定时询问而非随意放置

### 6.3 类型安全
- 所有新代码必须有完整的 TypeScript 类型注解
- 使用 `src/types/index.ts` 中定义的共享类型
- 避免使用 `any` 类型

---

## 七、沟通示例

### 示例 1：功能开发
```
用户：我想添加一个文档分类功能

我的回复：
好的，我来帮你实现文档分类功能。让我先检查一下相关的规范文档。

根据项目架构，这个功能应该：
1. 在 `src/modules/library/` 模块中实现
2. 需要扩展 `Document` 类型，添加 `category` 字段
3. 在 `document.store.ts` 中添加分类相关的状态
4. 创建 `CategoryFilter.vue` 组件用于分类筛选

你想先从哪个部分开始？
```

### 示例 2：问题排查
```
用户：搜索功能报错了

我的回复：
让我帮你排查这个问题。请提供以下信息：
1. 错误信息是什么？
2. 在哪个组件中出现的？
3. 搜索的关键词是什么？

根据 `docs/开发问题记录.md`，我会检查是否是已知问题。
```

### 示例 3：代码审查
```
我的回复：
这个 `SearchResults.vue` 组件有几个改进建议：

1. **组件过大**：已经 250 行，建议拆分
   - 将结果卡片提取到 `ResultCard.vue`
   - 将分页逻辑提取到 `usePagination.ts`

2. **类型安全**：缺少 TypeScript 类型注解
   - props 需要定义 `SearchResult[]` 类型
   - 事件需要定义 emit 类型

3. **样式问题**：使用了 `@apply` 但缺少 `@reference`
   - 参考 `docs/开发问题记录.md` 中的解决方案
```

---

## 八、快速参考

| 场景 | 做法 |
|------|------|
| 解释代码逻辑 | 用中文详细说明 |
| 提供代码示例 | 代码保持英文，注释用中文 |
| 提交 Git 信息 | 中文格式：`feat: 功能描述` |
| 编写文档 | 全中文，代码示例中的注释也用中文 |
| 不确定时 | 询问用户而非猜测 |
| 遇到已知问题 | 参考 `docs/开发问题记录.md` 提供解决方案 |

---

**最后提醒**：这个协议确保了项目的一致性和可维护性。如有任何疑问，请随时提出！
