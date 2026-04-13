# 文档智搜 Pro

<p align="center">
  <img src="./image.png" alt="文档智搜 Pro" width="600">
</p>

<p align="center">
  本地文档智能搜索工具 | 支持 PDF / DOCX / TXT 多格式
</p>

---

## 功能特性

- **多格式支持** - 解析 PDF、DOCX、TXT 文档，提取纯文本内容
- **智能搜索** - 精确匹配与间隔搜索双模式，结果按相关度排序
- **本地存储** - 基于 IndexedDB，数据完全离线，无需联网
- **选字提取** - 从字符网格中框选提取，支持连续数字/字母智能分组
- **详情定位** - 点击搜索结果跳转详情页，高亮显示匹配位置

## 技术栈

```
Vue 3.5 + TypeScript 5.9 + Vite 8
Pinia + Tailwind CSS v4 + IndexedDB
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）

### 安装运行

```powershell
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
src/
├── modules/           # 业务模块
│   ├── search/        # 搜索模块
│   ├── library/       # 文档库模块
│   ├── extractor/     # 选字提取模块
│   └── detail/        # 文档详情模块
├── components/        # 全局组件
│   ├── layout/        # 布局组件
│   ├── modal/         # 弹窗组件
│   └── feedback/      # 反馈组件
├── composables/       # 组合式函数
├── services/          # 服务层
├── stores/            # 状态管理
└── types/             # 类型定义
```

## NPM Scripts

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查 + 构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm test` | 运行单元测试 |
| `pnpm lint` | OxLint 代码检查 |
| `pnpm format` | OxFmt 格式化 |

## 核心模块

### 搜索模块

- **精确搜索**：完全匹配关键词
- **间隔搜索**：允许字符间有间隔，按紧密度排序
- **符号过滤**：只匹配中英文和数字
- **结果高亮**：高亮显示匹配位置

### 文档库模块

- 拖拽上传 PDF/DOCX/TXT 文件
- 文档列表管理
- 单条/批量删除

### 选字提取模块

- 字符网格可视化展示
- 支持框选连续提取
- 连续数字/字母智能分组
- 预览模式切换

## 开发规范

详见 [docs-now/README.md](./docs-now/README.md)

- 路径别名：`@` → `src/`
- 组件命名：PascalCase.vue
- Composable：use*.ts
- Service：*.service.ts
- Store：*.store.ts

## 许可证

MIT
