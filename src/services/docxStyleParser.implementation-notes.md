# DOCX 样式解析器 - 段落格式和结构元素实现说明

## 任务 14.3 实现内容

本任务实现了 DOCX 文档的段落格式和结构元素解析功能，满足 Requirements 8.6, 8.7, 8.8, 8.9, 8.10。

## 已实现功能

### 1. 段落对齐 (Requirement 8.6)

**实现位置**: `extractParagraphStyle()` 方法

**支持的对齐方式**:
- `left` - 左对齐
- `center` - 居中对齐
- `right` - 右对齐
- `both` (justify) - 两端对齐

**XML 解析**:
```xml
<w:pPr>
  <w:jc w:val="center"/>
</w:pPr>
```

**生成的 CSS**:
```css
text-align: center;
```

### 2. 段落缩进 (Requirement 8.7)

**实现位置**: `extractParagraphStyle()` 方法

**支持的缩进类型**:
- `marginLeft` - 左缩进 (w:ind left)
- `textIndent` - 首行缩进 (w:ind firstLine)

**XML 解析**:
```xml
<w:pPr>
  <w:ind w:left="720" w:firstLine="360"/>
</w:pPr>
```

**单位转换**: DOCX 使用 twips (1/20 磅)，转换为磅 (pt)
- 720 twips = 36pt
- 360 twips = 18pt

**生成的 CSS**:
```css
margin-left: 36pt;
text-indent: 18pt;
```

### 3. 表格 (Requirement 8.8)

**实现位置**: `parseTable()` 方法

**功能**:
- 解析表格结构 (w:tbl)
- 解析表格行 (w:tr)
- 解析表格单元格 (w:tc)
- 保留单元格边框样式
- 支持单元格内的段落和样式

**XML 结构**:
```xml
<w:tbl>
  <w:tr>
    <w:tc>
      <w:p>
        <w:r><w:t>单元格内容</w:t></w:r>
      </w:p>
    </w:tc>
  </w:tr>
</w:tbl>
```

**生成的 HTML**:
```html
<table style="width: 100%; border-collapse: collapse; margin: 1em 0;">
  <tr>
    <td style="border: 1px solid #e2e8f0; padding: 0.5em;">
      <p class="docx-p">单元格内容</p>
    </td>
  </tr>
</table>
```

### 4. 列表 (Requirement 8.9)

**实现位置**: `extractParagraphStyle()` 和 `wrapParagraphWithStyle()` 方法

**功能**:
- 检测列表项 (w:numPr)
- 支持多层级列表 (w:ilvl)
- 自动添加列表标记 (•)
- 根据层级调整缩进

**XML 解析**:
```xml
<w:pPr>
  <w:numPr>
    <w:ilvl w:val="0"/>
    <w:numId w:val="1"/>
  </w:numPr>
</w:pPr>
```

**层级缩进计算**:
- 第 0 层: 20pt
- 第 1 层: 40pt
- 第 2 层: 60pt
- 公式: `(level * 20 + 20)pt`

**生成的 HTML**:
```html
<p class="docx-p" style="padding-left: 20pt; position: relative;">
  <span style="position: absolute; left: 5pt;">•</span>
  列表项内容
</p>
```

### 5. 换行符 (Requirement 8.10)

**实现位置**: `parseParagraph()` 方法

**功能**:
- 检测段落内的换行符 (w:br)
- 在文本中插入换行符 `\n`
- 在 HTML 中插入 `<span class="docx-br"></span>`

**XML 解析**:
```xml
<w:r>
  <w:t>第一行</w:t>
</w:r>
<w:r>
  <w:br/>
</w:r>
<w:r>
  <w:t>第二行</w:t>
</w:r>
```

**处理逻辑**:
1. 遍历每个文本运行 (w:r)
2. 检查是否包含 w:br 元素
3. 如果包含，在文本和 HTML 中添加换行标记

**生成的 HTML**:
```html
<p class="docx-p">
  第一行<span class="docx-br"></span>第二行
</p>
```

**CSS 样式** (在 src/style.css 中定义):
```css
.docx-br {
  display: block;
  content: "";
  margin-bottom: 0.3em;
}
```

## 实现细节

### 段落样式包装

所有段落都使用 `wrapParagraphWithStyle()` 方法包装，该方法：
1. 添加 `docx-p` CSS 类
2. 应用对齐、缩进等样式
3. 处理列表项的特殊样式
4. 确保空段落显示为 `&nbsp;`

### 样式优先级

样式应用顺序：
1. 段落级样式 (对齐、缩进)
2. 列表样式 (如果是列表项)
3. 文本运行样式 (颜色、字体等)

### 错误处理

- 如果 XML 元素不存在，返回空样式对象
- 如果属性值无效，跳过该样式
- 使用命名空间兼容的选择器 (`w\\:tag, tag`)

## 测试验证

### 单元测试

现有测试文件 `fileParser.service.test.ts` 验证：
- ✓ DOCX 文件解析返回非空文本
- ✓ HTML 输出正确生成
- ✓ 使用真实 DOCX 文件测试

### 手动测试

创建了 `docxStyleParser.manual-test.ts` 用于：
- 验证 XML 解析正确性
- 检查各个功能的实现
- 提供调试工具

### 集成测试

通过 `fileParser.service.ts` 集成：
- ✓ 优先使用新解析器
- ✓ 失败时降级到 mammoth
- ✓ 保持向后兼容

## 与全局样式的配合

在 `src/style.css` 中定义的相关样式：

```css
/* 段落样式 */
.docx-p {
  display: block;
  min-height: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.6;
  word-wrap: break-word;
}

/* 换行符样式 */
.docx-br {
  display: block;
  content: "";
  margin-bottom: 0.3em;
}

/* 文档内容渲染容器 */
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
```

## 性能考虑

1. **DOM 查询优化**: 使用 `querySelectorAll` 一次性获取所有元素
2. **字符串拼接**: 使用数组 join 而非字符串连接
3. **样式缓存**: 提取样式后立即应用，避免重复计算
4. **命名空间处理**: 同时支持带命名空间和不带命名空间的选择器

## 已知限制

1. **列表编号**: 目前只支持简单的圆点标记，不支持数字编号
2. **表格样式**: 使用固定的边框样式，不解析 DOCX 的表格样式定义
3. **复杂缩进**: 不支持悬挂缩进等高级缩进类型
4. **换行符类型**: 不区分软换行和硬换行

## 未来改进方向

1. 支持更多列表样式（数字、字母、罗马数字）
2. 解析 DOCX 的样式定义文件 (styles.xml)
3. 支持更复杂的表格样式（合并单元格、表格边框样式）
4. 优化大文档的解析性能

## 总结

任务 14.3 已完成，所有要求的功能都已实现：
- ✅ 段落对齐 (8.6)
- ✅ 段落缩进 (8.7)
- ✅ 表格解析 (8.8)
- ✅ 列表格式 (8.9)
- ✅ 换行符处理 (8.10)

所有测试通过，代码已集成到主解析流程中。
