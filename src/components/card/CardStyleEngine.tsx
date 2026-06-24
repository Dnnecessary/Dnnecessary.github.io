import React, { useMemo } from 'react';
import type { TemplateStyles } from '@/types/card';

/**
 * 校验 CSS 颜色值格式，防止模板颜色值中包含 `}` 等字符破出 CSS 规则。
 * 允许：hex / rgb() / rgba() / hsl() / hsla() / 8位hex
 * 不合法时返回 fallback（默认 transparent）。
 */
const CSS_COLOR_RE = /^(#([0-9a-fA-F]{3,8})|(rgba?|hsla?)\([^)]{1,80}\))$/;
export function sc(val: string | undefined, fallback = 'transparent'): string {
  if (!val) return fallback;
  const v = val.trim();
  return CSS_COLOR_RE.test(v) ? v : fallback;
}

/**
 * CardStyleEngine：将 TemplateStyles 转换为卡片渲染所需的 CSS 样式标签。
 *
 * 拆分自 CardPreview.tsx（原 1043 行），将样式生成逻辑独立为纯函数式组件，
 * 避免样式计算与渲染逻辑混在一起，也便于后续新增模板样式扩展。
 *
 * 使用方式：<CardStyleEngine styles={styles} /> 会渲染一个 <style> 标签。
 */
interface CardStyleEngineProps {
  styles: TemplateStyles;
}

export const CardStyleEngine: React.FC<CardStyleEngineProps> = ({ styles }) => {
  // ─── 引用块样式（独立管理）──────────────────────────────────────────────────
  const blockquoteCSS = useMemo(() => {
    const blockquoteBg = sc(styles.blockquoteBg, '#F5F5F5');
    return styles.blockquoteStyle === 'classic'
      ? `
    .card-render blockquote { border-left: 5px solid ${sc(styles.blockquoteBorder)}; background: ${blockquoteBg}; padding: 16px 20px; margin: 10px 0; border-radius: 0 4px 4px 0; }
    .card-render blockquote::before { display: none; }
    .card-render blockquote p { color: ${sc(styles.blockquoteText ?? styles.textColor)}; font-style: normal; margin: 0; }`
      : `
    .card-render blockquote { position: relative; padding: 12px 16px 12px 22px; margin: 10px 0; background: ${blockquoteBg}; border-radius: 8px; overflow: hidden; }
    .card-render blockquote::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: ${sc(styles.blockquoteBorder)}; border-radius: 0 3px 3px 0; }
    .card-render blockquote p { color: ${sc(styles.blockquoteText ?? styles.textColor)}; font-style: normal; margin: 0; }`;
  }, [styles.blockquoteStyle, styles.blockquoteBg, styles.blockquoteBorder, styles.blockquoteText, styles.textColor]);

  // ─── H1 标题样式 ─────────────────────────────────────────────────────────────
  const h1CSS = useMemo(() => {
    const h1Style = styles.titleBannerBg
      ? `background: ${sc(styles.titleBannerBg)}; color: ${sc(styles.titleBannerTextColor, '#FFFFFF')}; border-radius: 8px; padding: 12px 20px; text-align: center; font-weight: 700; margin: 12px 0 14px; font-size: var(--tpl-title-size); line-height: 1.4;`
      : `color: ${sc(styles.titleColor)}; font-size: var(--tpl-title-size); font-weight: 700; margin: 12px 0 6px;`;
    return `.card-render h1 { ${h1Style} }`;
  }, [styles.titleBannerBg, styles.titleBannerTextColor, styles.titleColor]);

  // ─── H2 标题样式 ─────────────────────────────────────────────────────────────
  const h2CSS = useMemo(() => {
    return `.card-render h2 { color: ${sc(styles.h2Color ?? styles.titleColor)}; font-size: var(--tpl-h2-size); font-weight: 600; margin: 10px 0 5px; }`;
  }, [styles.h2Color, styles.titleColor]);

  // ─── H3 标题样式 ─────────────────────────────────────────────────────────────
  const h3CSS = useMemo(() => {
    return `.card-render h3 { color: ${sc(styles.h3Color ?? styles.h2Color ?? styles.titleColor)}; font-size: var(--tpl-h3-size); font-weight: 600; margin: 8px 0 4px; }`;
  }, [styles.h3Color, styles.h2Color, styles.titleColor]);

  // ─── 标题装饰线 ──────────────────────────────────────────────────────────────
  const titleBarCSS = useMemo(() => {
    if (!styles.titleDecorationBar) return '';
    return `
    .card-render h1::after { content: ""; display: block; width: 40px; height: 4px; background: ${sc(styles.accentColor)}; margin-top: 8px; border-radius: 2px; }
    .card-render h2::after { content: ""; display: block; width: 32px; height: 3px; background: ${sc(styles.accentColor)}; margin-top: 6px; border-radius: 2px; }`;
  }, [styles.titleDecorationBar, styles.accentColor]);

  // ─── 段落样式 ────────────────────────────────────────────────────────────────
  const paragraphCSS = useMemo(() => {
    return `.card-render p { margin: 5px 0; color: ${sc(styles.textColor)}; }`;
  }, [styles.textColor]);

  // ─── 行内元素样式 ────────────────────────────────────────────────────────────
  const inlineCSS = useMemo(() => {
    return `
    .card-render strong { color: ${sc(styles.accentColor)}; font-weight: 700; }
    .card-render em { font-style: italic; ${styles.emColor ? `color: ${sc(styles.emColor)};` : ''} }
    .card-render del, .card-render s { ${styles.strikethroughColor ? `color: ${sc(styles.strikethroughColor)};` : ''} }
    .card-render a { color: ${sc(styles.linkColor ?? styles.accentColor)}; text-decoration: underline; }`;
  }, [styles.accentColor, styles.emColor, styles.strikethroughColor, styles.linkColor]);

  // ─── 列表样式 ──────────────────────────────────────────────────────────────────
  const listCSS = useMemo(() => {
    return `
    .card-render ul { list-style: none; padding-left: 0; margin: 6px 0; }
    .card-render ul li { display: flex; align-items: flex-start; gap: 10px; margin: 9px 0; color: ${sc(styles.textColor)}; }
    .card-render ol { list-style: none; padding-left: 0; margin: 6px 0; counter-reset: ol-counter; }
    .card-render ol li { counter-increment: ol-counter; display: flex; align-items: flex-start; gap: 6px; margin: 7px 0; color: ${sc(styles.textColor)}; }
    .card-render li > p { margin: 0; padding: 0; display: inline; }`;
  }, [styles.textColor]);

  // ─── 列表符号样式 ─────────────────────────────────────────────────────────────
  const bulletCSS = useMemo(() => {
    return `.card-render ul li::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 2px; background: ${sc(styles.bulletColor)}; margin-top: calc(0.8em - 3px); flex-shrink: 0; }`;
  }, [styles.bulletColor]);

  // ─── 有序列表数字样式 ─────────────────────────────────────────────────────────
  const olCSS = useMemo(() => {
    return `.card-render ol li::before { content: counter(ol-counter) "."; color: ${sc(styles.olNumberColor ?? styles.textColor)}; font-size: 1em; font-weight: 600; flex-shrink: 0; line-height: 1.5; min-width: 1.4em; }`;
  }, [styles.olNumberColor, styles.textColor]);

  // ─── 代码块样式 ──────────────────────────────────────────────────────────────
  const codeCSS = useMemo(() => {
    return `
    .card-render code { background: ${sc(styles.codeBg)}; color: ${sc(styles.codeText)}; border-radius: 3px; padding: 1px 5px; font-size: 0.875em; font-family: 'Fira Code', 'Consolas', monospace; }
    .card-render .hljs-pre { background: ${sc(styles.codeBg)}; border-radius: 6px; padding: 12px; margin: 8px 0; overflow-x: auto; }
    .card-render .hljs-pre code { background: transparent; padding: 0; color: ${sc(styles.codeText)}; font-size: var(--tpl-table-size); }`;
  }, [styles.codeBg, styles.codeText]);

  // ─── 表格样式 ─────────────────────────────────────────────────────────────────
  const tableCSS = useMemo(() => {
    return `
    .card-render table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: var(--tpl-table-size); }
    .card-render table th { background: ${sc(styles.listNumberBg)}22; color: ${sc(styles.titleColor)}; border: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; padding: 6px 10px; font-weight: 600; }
    .card-render table td { border: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; padding: 5px 10px; color: ${sc(styles.textColor)}; }`;
  }, [styles.listNumberBg, styles.titleColor, styles.dividerColor, styles.textColor]);

  // ─── 分割线样式 ────────────────────────────────────────────────────────────────
  const hrCSS = useMemo(() => {
    return `.card-render hr { border: none; border-top: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; margin: 12px 0; }`;
  }, [styles.dividerColor, styles.textColor]);

  // ─── 图片样式 ─────────────────────────────────────────────────────────────────
  const imgCSS = useMemo(() => {
    return `.card-render img { max-width: 100%; border-radius: 6px; }`;
  }, []);

  // ─── 高亮样式 ─────────────────────────────────────────────────────────────────
  const markCSS = useMemo(() => {
    return `.card-render mark {
      ${styles.markBg ? `background-color: ${sc(styles.markBg)} !important;` : ''}
      border-radius: 3px;
      padding: 1px 4px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }`;
  }, [styles.markBg]);

  // ─── 奶油文件夹专用样式 ────────────────────────────────────────────────────────
  const folderCSS = useMemo(() => {
    if (!styles.folderStyle && !styles.pageBg) return '';
    const css: string[] = [];

    if (styles.folderStyle) {
      css.push(`
        .card-folder { position: relative; }
        .card-folder::before {
          content: "";
          position: absolute;
          top: 0;
          left: 20%;
          width: 180px;
          height: 42px;
          background: ${sc(styles.cardBg)};
          border-radius: 0 0 24px 24px;
          z-index: 2;
        }
      `);
    }

    if (styles.folderStyle) {
      css.push(`
        .card-folder .card-render blockquote {
          background: ${sc(styles.blockquoteBg, '#F4ECDD')};
          border-radius: 22px;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          padding: 16px 20px;
          margin: 18px 0px 16px 0px;
        }
        .card-folder .card-render blockquote::before { display: none; }
        .card-folder .card-render blockquote p { color: ${sc(styles.blockquoteText ?? styles.textColor)}; font-style: normal; margin: 0; }
      `);
    }

    if (styles.folderStyle) {
      css.push(`
        .card-folder .card-render table { background: #FFFFFF; border-collapse: collapse; margin: 20px 0; font-size: var(--tpl-table-size); }
        .card-folder .card-render table thead { background: #F8F4EB; }
        .card-folder .card-render table th, .card-folder .card-render table td { border: 1px solid ${sc(styles.dividerColor ?? '#DDD2C3')}; padding: 8px 12px; }
        .card-folder .card-render table th { color: ${sc(styles.titleColor)}; font-weight: 600; }
        .card-folder .card-render table td { color: ${sc(styles.textColor)}; }
      `);
    }

    if (styles.folderStyle) {
      css.push(`
        .card-folder .card-render hr { border: none; height: 1px; background: ${sc(styles.dividerColor ?? '#E5DDD3')}; margin: 20px 0; }
      `);
    }

    if (styles.folderStyle) {
      css.push(`
        .card-folder .card-render img { max-width: 100%; border-radius: 18px; }
      `);
    }

    if (styles.tipBg || styles.tipBorder) {
      css.push(`
        .card-folder .card-render .tip, .card-folder .card-render [class*="tip"] {
          background: ${sc(styles.tipBg, '#F6EFE3')};
          border-left: 6px solid ${sc(styles.tipBorder ?? styles.accentColor)};
          border-radius: 18px;
          padding: 14px 18px;
          margin: 16px 0;
        }
      `);
    }

    return css.join('\n');
  }, [styles.folderStyle, styles.pageBg, styles.cardBg, styles.blockquoteBg, styles.blockquoteText, styles.textColor, styles.dividerColor, styles.tipBg, styles.tipBorder, styles.accentColor, styles.titleColor]);

  // ─── 合并所有样式 ────────────────────────────────────────────────────────────
  const contentStyleTag = useMemo(() => {
    return `
    ${h1CSS}
    ${h2CSS}
    ${h3CSS}
    ${titleBarCSS}
    ${paragraphCSS}
    ${inlineCSS}
    ${listCSS}
    ${bulletCSS}
    ${olCSS}
    ${blockquoteCSS}
    ${codeCSS}
    ${tableCSS}
    ${hrCSS}
    ${imgCSS}
    ${markCSS}
    ${folderCSS}
    `;
  }, [h1CSS, h2CSS, h3CSS, titleBarCSS, paragraphCSS, inlineCSS, listCSS, bulletCSS, olCSS, blockquoteCSS, codeCSS, tableCSS, hrCSS, imgCSS, markCSS, folderCSS]);

  return <style>{contentStyleTag}</style>;
};
