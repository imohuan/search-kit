/**
 * 搜索引擎服务 - 实现间隔搜索和精确搜索
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

import type { Document, SearchResult, SearchOptions, MatchInfo } from "@/types";

/**
 * 搜索引擎服务类
 */
class SearchService {
  /**
   * 执行搜索
   * @param query 搜索关键词
   * @param documents 文档列表
   * @param options 搜索选项
   * @returns 排序后的搜索结果
   */
  search(query: string, documents: Document[], options: SearchOptions): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const doc of documents) {
      if (!doc.id) continue;

      const matches = this.findMatches(doc.content, query, options);

      for (const match of matches) {
        const highlightedSnippet = this.generateSnippet(
          doc.content,
          match,
          query,
          options.previewRange,
          options.isExact,
        );

        results.push({
          id: doc.id,
          fileName: doc.fileName,
          content: doc.content,
          matchIndex: match.index,
          matchLength: match.length,
          highlightedSnippet,
        });
      }
    }

    // 按匹配跨度长度升序排序（紧密度优先）
    return this.sortResults(results);
  }

  /**
   * 查找所有匹配位置
   * @param content 文档内容
   * @param query 搜索关键词
   * @param options 搜索选项
   * @returns 匹配信息数组
   */
  findMatches(content: string, query: string, options: SearchOptions): MatchInfo[] {
    if (options.isExact) {
      return this.findExactMatches(content, query);
    }
    return this.findIntervalMatches(content, query, options.maxGap);
  }

  /**
   * 精确搜索 - 查找连续匹配（修复重复问题）
   */
  private findExactMatches(content: string, query: string): MatchInfo[] {
    const matches: MatchInfo[] = [];
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let startIndex = 0;
    while (startIndex < content.length) {
      const index = lowerContent.indexOf(lowerQuery, startIndex);
      if (index === -1) break;

      // 生成位置数组
      const positions: number[] = [];
      for (let i = 0; i < query.length; i++) {
        positions.push(index + i);
      }

      matches.push({
        index,
        length: query.length,
        positions,
      });

      // 移动到下一个位置，避免重复（从匹配结束位置开始）
      startIndex = index + query.length;
    }

    return matches;
  }

  /**
   * 间隔搜索 - 查找字符按顺序出现且间隔不超过maxGap的匹配
   */
  private findIntervalMatches(content: string, query: string, maxGap: number): MatchInfo[] {
    const matches: MatchInfo[] = [];
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.length === 0) return matches;

    // 从每个可能的起始位置开始搜索
    let searchStart = 0;
    while (searchStart < content.length) {
      const match = this.findSingleIntervalMatch(lowerContent, lowerQuery, maxGap, searchStart);

      if (!match) break;

      matches.push(match);
      // 从第一个匹配字符的下一个位置继续搜索
      const firstPos = match.positions[0];
      searchStart = firstPos !== undefined ? firstPos + 1 : searchStart + 1;
    }

    return matches;
  }

  /**
   * 查找单个间隔匹配
   */
  private findSingleIntervalMatch(content: string, query: string, maxGap: number, startFrom: number): MatchInfo | null {
    const positions: number[] = [];
    let currentPos = startFrom;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      if (char === undefined) return null;

      const foundPos = content.indexOf(char, currentPos);

      if (foundPos === -1) return null;

      // 检查间隔是否超过maxGap（第一个字符不检查间隔）
      const prevPos = positions[i - 1];
      if (i > 0 && prevPos !== undefined && foundPos - prevPos - 1 > maxGap) {
        return null;
      }

      positions.push(foundPos);
      currentPos = foundPos + 1;
    }

    const startIndex = positions[0];
    const endIndex = positions[positions.length - 1];

    if (startIndex === undefined || endIndex === undefined) return null;

    const length = endIndex - startIndex + 1;

    return {
      index: startIndex,
      length,
      positions,
    };
  }

  /**
   * 生成高亮片段
   */
  private generateSnippet(
    content: string,
    match: MatchInfo,
    _query: string,
    previewRange: number,
    _isExact: boolean,
  ): string {
    const start = Math.max(0, match.index - previewRange);
    const end = Math.min(content.length, match.index + match.length + previewRange);
    let snippet = content.slice(start, end);

    // 添加省略号
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    // 调整位置偏移（考虑省略号）
    const offset = start > 0 ? 3 : 0; // '...' 的长度
    const adjustedPositions = match.positions.map((pos) => pos - start + offset);

    // 高亮并转换为HTML格式（保留换行）
    const highlighted = this.highlightPositions(snippet, adjustedPositions);
    return this.textToHtml(highlighted);
  }

  /**
   * 将纯文本转换为带换行的HTML
   */
  private textToHtml(text: string): string {
    if (!text) return "";
    // 将换行符转换为div，确保每行显示
    return text
      .split("\n")
      .map((line) => `<div class="docx-p">${line || "<br>"}</div>`)
      .join("");
  }

  /**
   * 高亮指定位置的字符
   */
  private highlightPositions(text: string, positions: number[]): string {
    const posSet = new Set(positions.filter((p) => p >= 0 && p < text.length));
    let result = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === undefined) continue;

      if (posSet.has(i)) {
        result += `<mark>${this.escapeHtml(char)}</mark>`;
      } else {
        result += this.escapeHtml(char);
      }
    }

    return result;
  }

  /**
   * 生成高亮HTML文本（用于详情显示）
   * @param text 原始文本
   * @param query 搜索关键词
   * @param isExact 是否精确搜索
   * @returns 高亮后的HTML
   */
  highlightText(text: string, query: string, isExact: boolean): string {
    if (!query.trim()) return this.escapeHtml(text);

    if (isExact) {
      return this.highlightExactText(text, query);
    }
    return this.highlightIntervalText(text, query);
  }

  /**
   * 精确搜索高亮
   */
  private highlightExactText(text: string, query: string): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const parts: string[] = [];
    let lastIndex = 0;

    let index = lowerText.indexOf(lowerQuery);
    while (index !== -1) {
      // 添加匹配前的文本
      if (index > lastIndex) {
        parts.push(this.escapeHtml(text.slice(lastIndex, index)));
      }
      // 添加高亮的匹配文本
      parts.push(`<mark>${this.escapeHtml(text.slice(index, index + query.length))}</mark>`);
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
      parts.push(this.escapeHtml(text.slice(lastIndex)));
    }

    return parts.join("");
  }

  /**
   * 间隔搜索高亮（高亮所有查询字符出现的位置）
   */
  private highlightIntervalText(text: string, query: string): string {
    const lowerQuery = query.toLowerCase();
    const queryChars = new Set(lowerQuery.split(""));
    let result = "";

    for (const char of text) {
      if (queryChars.has(char.toLowerCase())) {
        result += `<mark>${this.escapeHtml(char)}</mark>`;
      } else {
        result += this.escapeHtml(char);
      }
    }

    return result;
  }

  /**
   * 排序搜索结果（按紧密度升序）
   */
  sortResults(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => a.matchLength - b.matchLength);
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
export const searchService = new SearchService();

// 导出类用于测试
export { SearchService };
