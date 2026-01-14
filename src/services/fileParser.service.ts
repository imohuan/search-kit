/**
 * 文件解析服务 - 解析 PDF、DOCX、TXT 文件
 * Requirements: 3.1
 */

import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import type { ParseResult } from "@/types";
import { docxStyleParserService } from "./docxStyleParser.service";

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * 文件解析服务类
 */
class FileParserService {
  /**
   * 解析文件内容
   * @param file 文件对象
   * @returns 解析结果（文本和HTML）
   */
  async parseFile(file: File): Promise<ParseResult> {
    const extension = this.getFileExtension(file.name).toLowerCase();

    switch (extension) {
      case "pdf":
        return await this.parsePDF(file);
      case "docx":
        return await this.parseDOCX(file);
      case "txt":
        return await this.parseTXT(file);
      default:
        throw new Error(`不支持的文件格式: ${extension}`);
    }
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
  }

  /**
   * 解析 PDF 文件
   */
  private async parsePDF(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const textParts: string[] = [];
      const htmlParts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join("");

        textParts.push(pageText);
        htmlParts.push(`<div class="pdf-page" data-page="${i}">${this.escapeHtml(pageText)}</div>`);
      }

      return {
        text: textParts.join("\n"),
        html: htmlParts.join("\n"),
        hasOriginalStyles: false,
      };
    } catch (error) {
      throw new Error(`PDF解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 解析 DOCX 文件
   */
  private async parseDOCX(file: File): Promise<ParseResult> {
    try {
      // 首先尝试使用新的样式解析器
      const result = await docxStyleParserService.parseDocxWithStyles(file);
      return result;
    } catch (error) {
      console.warn("DOCX 样式解析失败，降级到 mammoth:", error);

      // 降级到 mammoth 简单解析
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        // 从HTML中提取纯文本
        const text = this.htmlToText(result.value);

        return {
          text,
          html: result.value,
          hasOriginalStyles: false,
        };
      } catch (mammothError) {
        // 最后尝试提取原始文本作为fallback
        try {
          const arrayBuffer = await file.arrayBuffer();
          const rawResult = await mammoth.extractRawText({ arrayBuffer });
          return {
            text: rawResult.value,
            html: `<p>${this.escapeHtml(rawResult.value)}</p>`,
            hasOriginalStyles: false,
          };
        } catch {
          throw new Error(`DOCX解析失败: ${mammothError instanceof Error ? mammothError.message : "未知错误"}`);
        }
      }
    }
  }

  /**
   * 解析 TXT 文件
   */
  private async parseTXT(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const html = `<pre>${this.escapeHtml(text)}</pre>`;

      return {
        text,
        html,
        hasOriginalStyles: false,
      };
    } catch (error) {
      throw new Error(`TXT解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * HTML转纯文本
   */
  private htmlToText(html: string): string {
    // 创建临时DOM元素来提取文本
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  /**
   * 转义HTML特殊字符
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
  }
}

// 导出单例实例
export const fileParserService = new FileParserService();

// 导出类用于测试
export { FileParserService };
