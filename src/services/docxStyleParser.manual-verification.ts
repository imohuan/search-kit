/**
 * DOCX 样式解析器手动验证脚本
 * 用于验证 DOCX 文件的样式解析功能
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { docxStyleParserService } from "./docxStyleParser.service";

async function verifyDocxParsing() {
  console.log("=== DOCX 样式解析功能验证 ===\n");

  const testFiles = ["test-files/10633工程造价管理.docx", "test-files/消防.docx"];

  for (const filePath of testFiles) {
    console.log(`\n📄 测试文件: ${filePath}`);
    console.log("─".repeat(60));

    try {
      const absolutePath = resolve(process.cwd(), filePath);
      const buffer = readFileSync(absolutePath);

      // 创建 File 对象（Node.js 环境模拟）
      const file = new File([buffer], filePath.split("/").pop() || "test.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 解析文件
      const result = await docxStyleParserService.parseDocxWithStyles(file);

      // 验证结果
      console.log("✅ 解析成功");
      console.log(`   - 纯文本长度: ${result.text.length} 字符`);
      console.log(`   - HTML 长度: ${result.html.length} 字符`);
      console.log(`   - 包含原始样式: ${result.hasOriginalStyles ? "是" : "否"}`);

      // 检查样式信息
      const hasColorStyle = result.html.includes("color:");
      const hasBackgroundStyle = result.html.includes("background-color:");
      const hasFontSize = result.html.includes("font-size:");
      const hasBold = result.html.includes("font-weight: bold");
      const hasItalic = result.html.includes("font-style: italic");
      const hasTable = result.html.includes("<table");
      const hasParagraph = result.html.includes('class="docx-p"');

      console.log("\n   样式检测:");
      console.log(`   - 文字颜色: ${hasColorStyle ? "✓" : "✗"}`);
      console.log(`   - 背景/高亮: ${hasBackgroundStyle ? "✓" : "✗"}`);
      console.log(`   - 字号: ${hasFontSize ? "✓" : "✗"}`);
      console.log(`   - 粗体: ${hasBold ? "✓" : "✗"}`);
      console.log(`   - 斜体: ${hasItalic ? "✓" : "✗"}`);
      console.log(`   - 表格: ${hasTable ? "✓" : "✗"}`);
      console.log(`   - 段落: ${hasParagraph ? "✓" : "✗"}`);

      // 显示前 200 个字符的文本
      console.log(`\n   文本预览 (前 200 字符):`);
      console.log(`   ${result.text.substring(0, 200)}...`);

      // 显示前 500 个字符的 HTML
      console.log(`\n   HTML 预览 (前 500 字符):`);
      console.log(`   ${result.html.substring(0, 500)}...`);
    } catch (error) {
      console.error(`❌ 解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("验证完成");
}

// 运行验证
verifyDocxParsing().catch(console.error);
