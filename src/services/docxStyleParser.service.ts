/**
 * DOCX 样式解析服务 - 使用 JSZip 直接解析 DOCX XML 结构
 * 保留原始样式信息（颜色、高亮、字号、粗体、斜体、表格、列表等）
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */

import JSZip from "jszip";

/**
 * DOCX 文本运行样式
 */
export interface DocxRunStyle {
  color?: string; // 文字颜色 (w:color)
  highlight?: string; // 高亮颜色 (w:highlight)
  background?: string; // 背景底纹 (w:shd)
  fontSize?: number; // 字号 (w:sz)
  bold?: boolean; // 粗体 (w:b)
  italic?: boolean; // 斜体 (w:i)
}

/**
 * DOCX 段落样式
 */
export interface DocxParagraphStyle {
  alignment?: "left" | "center" | "right" | "justify"; // 对齐 (w:jc)
  marginLeft?: number; // 左缩进 (w:ind left)
  textIndent?: number; // 首行缩进 (w:ind firstLine)
  isList?: boolean; // 是否列表项 (w:numPr)
  listLevel?: number; // 列表层级
}

/**
 * DOCX 高亮颜色到 CSS 颜色的映射
 */
const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: "#FFFF00",
  green: "#00FF00",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  blue: "#0000FF",
  red: "#FF0000",
  darkBlue: "#00008B",
  darkCyan: "#008B8B",
  darkGreen: "#006400",
  darkMagenta: "#8B008B",
  darkRed: "#8B0000",
  darkYellow: "#808000",
  darkGray: "#A9A9A9",
  lightGray: "#D3D3D3",
  black: "#000000",
};

/**
 * DOCX 样式解析器类
 */
class DocxStyleParserService {
  /**
   * 解析 DOCX 文件并保留样式
   * @param file DOCX 文件对象
   * @returns 包含纯文本和带样式 HTML 的解析结果
   */
  async parseDocxWithStyles(file: File): Promise<{ text: string; html: string; hasOriginalStyles: boolean }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 读取 document.xml
      const documentXml = await zip.file("word/document.xml")?.async("text");
      if (!documentXml) {
        throw new Error("无法找到 document.xml");
      }

      // 解析 XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, "text/xml");

      // 检查解析错误
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error("XML 解析失败");
      }

      // 提取文本和 HTML
      const { text, html } = this.extractContentFromXml(xmlDoc);

      return {
        text,
        html,
        hasOriginalStyles: true,
      };
    } catch (error) {
      throw new Error(`DOCX 样式解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 从 XML 文档中提取内容
   */
  private extractContentFromXml(xmlDoc: Document): { text: string; html: string } {
    // 获取文档主体
    const body = xmlDoc.querySelector("w\\:body, body");
    if (!body) {
      return { text: "", html: "" };
    }

    // 递归遍历所有节点
    const result = this.traverseNodes(body);

    return {
      text: result.text,
      html: result.html,
    };
  }

  /**
   * 递归遍历节点，处理所有段落和表格（包括嵌套内容）
   */
  private traverseNodes(node: Element): { text: string; html: string } {
    const textParts: string[] = [];
    const htmlParts: string[] = [];

    const children = Array.from(node.children);

    children.forEach((child) => {
      const tagName = child.tagName.toLowerCase();

      if (tagName === "w:p" || tagName === "p") {
        // 段落
        const { text, html } = this.parseParagraph(child);
        textParts.push(text);
        htmlParts.push(html);
      } else if (tagName === "w:tbl" || tagName === "tbl") {
        // 表格
        const { text, html } = this.parseTable(child);
        textParts.push(text);
        htmlParts.push(html);
      } else if (
        tagName === "w:sdt" ||
        tagName === "sdt" ||
        tagName === "w:sdtcontent" ||
        tagName === "sdtcontent" ||
        tagName === "w:txbxcontent" ||
        tagName === "txbxcontent"
      ) {
        // 容器节点，递归进入
        const result = this.traverseNodes(child);
        textParts.push(result.text);
        htmlParts.push(result.html);
      } else if (child.children.length > 0 && !tagName.endsWith("pr")) {
        // 其他未知标签，尝试递归（但跳过属性节点如 pPr, rPr）
        const result = this.traverseNodes(child);
        if (result.text || result.html) {
          textParts.push(result.text);
          htmlParts.push(result.html);
        }
      }
    });

    return {
      text: textParts.join("\n"),
      html: htmlParts.join("\n"),
    };
  }

  /**
   * 解析段落
   */
  private parseParagraph(paragraph: Element): { text: string; html: string } {
    const textParts: string[] = [];
    const htmlParts: string[] = [];

    // 获取段落样式
    const paragraphStyle = this.extractParagraphStyle(paragraph);

    // 遍历段落的所有子节点（包括 w:r 和 w:br）
    const children = Array.from(paragraph.children);

    children.forEach((child) => {
      const tagName = child.tagName.toLowerCase();

      if (tagName === "w:r" || tagName === "r") {
        // 文本运行
        const runChildren = Array.from(child.children);
        let hasText = false;

        runChildren.forEach((runChild) => {
          const runChildTag = runChild.tagName.toLowerCase();

          if (runChildTag === "w:t" || runChildTag === "t") {
            // 文本节点
            const { text, html } = this.parseRun(child);
            if (text) {
              textParts.push(text);
              htmlParts.push(html);
              hasText = true;
            }
          } else if (runChildTag === "w:br" || runChildTag === "br") {
            // Run 内部的换行
            textParts.push("\n");
            htmlParts.push('<br class="docx-br">');
          }
        });

        // 检查是否只有 br 没有 t
        if (!hasText) {
          const hasBr = child.querySelector("w\\:br, br");
          if (hasBr) {
            textParts.push("\n");
            htmlParts.push('<br class="docx-br">');
          }
        }
      } else if (tagName === "w:br" || tagName === "br") {
        // 段落级别的换行
        textParts.push("\n");
        htmlParts.push('<br class="docx-br">');
      }
      // 忽略 w:pPr 等属性节点
    });

    const paragraphText = textParts.join("");
    const paragraphHtml = this.wrapParagraphWithStyle(htmlParts.join(""), paragraphStyle);

    return {
      text: paragraphText + "\n", // 确保段落后有换行
      html: paragraphHtml,
    };
  }

  /**
   * 解析表格
   */
  private parseTable(table: Element): { text: string; html: string } {
    const textParts: string[] = [];
    const htmlRows: string[] = [];

    // 获取所有行 (w:tr)
    const rows = table.querySelectorAll("w\\:tr, tr");

    rows.forEach((row) => {
      const rowTextParts: string[] = [];
      const htmlCells: string[] = [];

      // 获取所有单元格 (w:tc)
      const cells = row.querySelectorAll("w\\:tc, tc");

      cells.forEach((cell) => {
        const cellTextParts: string[] = [];
        const cellHtmlParts: string[] = [];

        // 获取单元格中的所有段落
        const paragraphs = cell.querySelectorAll("w\\:p, p");

        paragraphs.forEach((paragraph) => {
          const { text, html } = this.parseParagraph(paragraph);
          if (text) {
            cellTextParts.push(text);
            cellHtmlParts.push(html);
          }
        });

        const cellText = cellTextParts.join(" ");
        const cellHtml = cellHtmlParts.join("");

        rowTextParts.push(cellText);
        htmlCells.push(`<td style="border: 1px solid #e2e8f0; padding: 0.5em;">${cellHtml}</td>`);
      });

      textParts.push(rowTextParts.join("\t"));
      htmlRows.push(`<tr>${htmlCells.join("")}</tr>`);
    });

    const tableText = textParts.join("\n");
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 1em 0;">${htmlRows.join("")}</table>`;

    return {
      text: tableText,
      html: tableHtml,
    };
  }

  /**
   * 解析文本运行
   */
  private parseRun(run: Element): { text: string; html: string } {
    // 获取文本内容
    const textElements = run.querySelectorAll("w\\:t, t");
    const text = Array.from(textElements)
      .map((t) => t.textContent || "")
      .join("");

    if (!text) {
      return { text: "", html: "" };
    }

    // 获取运行样式
    const runStyle = this.extractRunStyle(run);

    // 生成带样式的 HTML
    const html = this.wrapTextWithStyle(text, runStyle);

    return { text, html };
  }

  /**
   * 提取文本运行样式
   */
  private extractRunStyle(run: Element): DocxRunStyle {
    const style: DocxRunStyle = {};

    // 获取样式属性 (w:rPr)
    const rPr = run.querySelector("w\\:rPr, rPr");
    if (!rPr) {
      return style;
    }

    // 文字颜色 (w:color)
    const colorElement = rPr.querySelector("w\\:color, color");
    if (colorElement) {
      const colorValue = colorElement.getAttribute("w:val") || colorElement.getAttribute("val");
      if (colorValue && colorValue !== "auto") {
        style.color = `#${colorValue}`;
      }
    }

    // 高亮颜色 (w:highlight)
    const highlightElement = rPr.querySelector("w\\:highlight, highlight");
    if (highlightElement) {
      const highlightValue = highlightElement.getAttribute("w:val") || highlightElement.getAttribute("val");
      if (highlightValue) {
        style.highlight = HIGHLIGHT_COLOR_MAP[highlightValue] || highlightValue;
      }
    }

    // 背景底纹 (w:shd)
    const shdElement = rPr.querySelector("w\\:shd, shd");
    if (shdElement) {
      const fillValue = shdElement.getAttribute("w:fill") || shdElement.getAttribute("fill");
      if (fillValue && fillValue !== "auto") {
        style.background = `#${fillValue}`;
      }
    }

    // 字号 (w:sz) - 单位是半磅，需要除以2
    const szElement = rPr.querySelector("w\\:sz, sz");
    if (szElement) {
      const szValue = szElement.getAttribute("w:val") || szElement.getAttribute("val");
      if (szValue) {
        style.fontSize = parseInt(szValue, 10) / 2;
      }
    }

    // 粗体 (w:b)
    const boldElement = rPr.querySelector("w\\:b, b");
    if (boldElement) {
      const boldValue = boldElement.getAttribute("w:val") || boldElement.getAttribute("val");
      style.bold = boldValue !== "0" && boldValue !== "false";
    }

    // 斜体 (w:i)
    const italicElement = rPr.querySelector("w\\:i, i");
    if (italicElement) {
      const italicValue = italicElement.getAttribute("w:val") || italicElement.getAttribute("val");
      style.italic = italicValue !== "0" && italicValue !== "false";
    }

    return style;
  }

  /**
   * 提取段落样式
   */
  private extractParagraphStyle(paragraph: Element): DocxParagraphStyle {
    const style: DocxParagraphStyle = {};

    // 获取段落属性 (w:pPr)
    const pPr = paragraph.querySelector("w\\:pPr, pPr");
    if (!pPr) {
      return style;
    }

    // 对齐方式 (w:jc)
    const jcElement = pPr.querySelector("w\\:jc, jc");
    if (jcElement) {
      const jcValue = jcElement.getAttribute("w:val") || jcElement.getAttribute("val");
      if (jcValue) {
        const alignmentMap: Record<string, "left" | "center" | "right" | "justify"> = {
          left: "left",
          center: "center",
          right: "right",
          both: "justify",
        };
        style.alignment = alignmentMap[jcValue];
      }
    }

    // 缩进 (w:ind)
    const indElement = pPr.querySelector("w\\:ind, ind");
    if (indElement) {
      const leftValue = indElement.getAttribute("w:left") || indElement.getAttribute("left");
      const firstLineValue = indElement.getAttribute("w:firstLine") || indElement.getAttribute("firstLine");

      if (leftValue) {
        style.marginLeft = parseInt(leftValue, 10) / 20; // 转换为磅
      }
      if (firstLineValue) {
        style.textIndent = parseInt(firstLineValue, 10) / 20; // 转换为磅
      }
    }

    // 列表编号 (w:numPr)
    const numPrElement = pPr.querySelector("w\\:numPr, numPr");
    if (numPrElement) {
      style.isList = true;

      const ilvlElement = numPrElement.querySelector("w\\:ilvl, ilvl");
      if (ilvlElement) {
        const ilvlValue = ilvlElement.getAttribute("w:val") || ilvlElement.getAttribute("val");
        if (ilvlValue) {
          style.listLevel = parseInt(ilvlValue, 10);
        }
      }
    }

    return style;
  }

  /**
   * 用样式包装文本
   */
  private wrapTextWithStyle(text: string, style: DocxRunStyle): string {
    const styles: string[] = [];

    if (style.color) {
      styles.push(`color: ${style.color}`);
    }
    if (style.highlight) {
      styles.push(`background-color: ${style.highlight}`);
    }
    if (style.background) {
      styles.push(`background-color: ${style.background}`);
    }
    if (style.fontSize) {
      styles.push(`font-size: ${style.fontSize}pt`);
    }
    if (style.bold) {
      styles.push("font-weight: bold");
    }
    if (style.italic) {
      styles.push("font-style: italic");
    }

    const escapedText = this.escapeHtml(text);

    if (styles.length > 0) {
      return `<span style="${styles.join("; ")}">${escapedText}</span>`;
    }

    return escapedText;
  }

  /**
   * 用段落样式包装内容
   */
  private wrapParagraphWithStyle(content: string, style: DocxParagraphStyle): string {
    const styles: string[] = [
      "display: block",
      "min-height: 1.5em",
      "margin-bottom: 0.8em",
      "line-height: 1.6",
      "word-wrap: break-word",
    ];
    const classes: string[] = ["docx-p"];

    if (style.alignment) {
      styles.push(`text-align: ${style.alignment}`);
    }
    if (style.marginLeft) {
      styles.push(`margin-left: ${style.marginLeft}pt`);
    }
    if (style.textIndent) {
      styles.push(`text-indent: ${style.textIndent}pt`);
    }
    if (style.isList) {
      // 列表项样式
      styles.push("display: list-item");
      styles.push("list-style-type: disc");
      styles.push("list-style-position: inside");

      const indent = (style.listLevel || 0) * 20 + 20;
      if (!style.marginLeft) {
        styles.push(`margin-left: ${indent}pt`);
      }
    }

    const styleAttr = ` style="${styles.join("; ")}"`;
    const classAttr = ` class="${classes.join(" ")}"`;

    // 确保空段落也有高度
    const innerContent = content || "<br>";

    return `<div${classAttr}${styleAttr}>${innerContent}</div>`;
  }

  /**
   * 转义 HTML 特殊字符
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
export const docxStyleParserService = new DocxStyleParserService();

// 导出类用于测试
export { DocxStyleParserService };
