import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import type { TemplateStyles } from '@/types/card';

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs-pre"><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {
        // fall through
      }
    }
    return `<pre class="hljs-pre"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

/**
 * 模块级渲染缓存（LRU-lite）。
 *
 * 问题背景：
 *   md.render() 包含词法分析 + 语法树构建 + HTML 生成 + highlight.js 代码着色，
 *   是整个预览流水线中最重的 CPU 操作。每次 React 重渲染（模板切换、字体调整、
 *   水印开关等）都会触发一次完整渲染，即使 markdown 内容完全未变。
 *
 * 方案：Map 固定容量 = 16 条，超出后删除最早插入项（FIFO 近似 LRU）。
 *   - 16 条约覆盖单次会话内的全部历史输入，命中率接近 100%。
 *   - Map 保存的是纯字符串（key + value），内存上限约 16 × 平均文档大小。
 *   - 不使用 WeakMap（key 为 string，非对象）。
 */
const RENDER_CACHE_MAX = 16;
const renderCache = new Map<string, string>();

function cachedRender(text: string): string {
  const hit = renderCache.get(text);
  if (hit !== undefined) return hit;

  const result = md.render(text);

  if (renderCache.size >= RENDER_CACHE_MAX) {
    // 删除最早插入的 key（Map 迭代顺序 = 插入顺序）
    renderCache.delete(renderCache.keys().next().value!);
  }
  renderCache.set(text, result);
  return result;
}

// 自定义渲染器
export function renderMarkdown(text: string): string {
  return cachedRender(text);
}

export function getTemplateContentStyles(styles: TemplateStyles, font: { baseFontSize: number; titleLinked: boolean; titleFontSize: number; tableLinked: boolean; tableFontSize: number }): Record<string, string> {
  const titleMultiplier = font.titleLinked ? font.titleFontSize : font.titleFontSize / font.baseFontSize;
  const tableMultiplier = font.tableLinked ? font.tableFontSize : font.tableFontSize / font.baseFontSize;

  return {
    '--tpl-title': styles.titleColor,
    '--tpl-text': styles.textColor,
    '--tpl-accent': styles.accentColor,
    '--tpl-list-num-bg': styles.listNumberBg,
    '--tpl-list-num-color': styles.listNumberColor,
    '--tpl-bullet': styles.bulletColor,
    '--tpl-quote-border': styles.blockquoteBorder,
    '--tpl-quote-text': styles.blockquoteText ?? styles.textColor,
    '--tpl-code-bg': styles.codeBg,
    '--tpl-code-text': styles.codeText,
    '--tpl-divider': styles.dividerColor ?? `${styles.textColor}33`,
    '--tpl-title-size': `${titleMultiplier * 1.2}em`,
    '--tpl-h2-size': `${titleMultiplier * 1.0}em`,
    '--tpl-h3-size': `${titleMultiplier * 0.85}em`,
    '--tpl-table-size': `${tableMultiplier}em`,
  };
}
