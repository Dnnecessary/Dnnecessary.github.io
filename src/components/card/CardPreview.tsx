import React, { useEffect, useState, useDeferredValue, useMemo, useRef } from 'react';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';
import { useMarkdown, useConfig, useFontContext } from '@/contexts/CardContext';
import { TEMPLATES } from '@/data/templates';
import { renderMarkdown, getTemplateContentStyles } from '@/lib/markdownRenderer';
import type { TemplateStyles } from '@/types/card';
import QRCode from 'qrcode';
import { splitContentIntoPages, getPageHeight, getPagedContentsCacheByKey, setPagedContentsCache, generatePagedContentsCacheKey } from '@/utils/paging';
import { loadHighlightTheme } from './HighlightThemeLoader';
import { CardStyleEngine } from './CardStyleEngine';
import WatermarkLayer from './WatermarkLayer';
import { CardHeader, CardFooter } from './CardElements';

// ─── 全局排版常量（与模板视觉风格分离）────────────────────────────────────────
/** 卡片统一内边距 */
const CARD_PADDING = '28px';
/** 卡片统一圆角（0 = 直角） */
const CARD_BORDER_RADIUS = '0';

// 允许卡片内容所需的安全标签与属性，禁止所有脚本类元素和事件属性
const PURIFY_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'h1','h2','h3','h4','h5','h6',
    'p','br','hr','blockquote',
    'strong','em','del','s','u','mark','code','pre',
    'ul','ol','li',
    'table','thead','tbody','tfoot','tr','th','td',
    'a','img',
    'span','div',
  ],
  ALLOWED_ATTR: ['href','src','alt','class','style','target','rel','width','height','start'],
  ALLOW_DATA_ATTR: false,
  FORBID_ATTR: ['onerror','onload','onclick','onmouseover','onfocus','oninput','onblur'],
};

/**
 * 过滤 style 属性内的 url() 调用，防止外链图片/追踪像素注入。
 * 保留字体、颜色等合法 CSS 声明，仅移除含 url(...) 的部分。
 * 在模块顶层注册一次，全局生效。
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (!(node instanceof Element)) return;
  const style = node.getAttribute('style');
  if (!style) return;
  // 移除所有含 url() 的 CSS 声明（跨行匹配，防止编码绕过）
  const cleaned = style.replace(/[^;]*url\s*\([^)]*\)[^;]*(;|$)/gi, '').trim();
  if (cleaned !== style) node.setAttribute('style', cleaned);
});

interface CardPreviewProps {
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

const CardPreview: React.FC<CardPreviewProps> = ({ previewRef }) => {
  const { markdown } = useMarkdown();
  const { config } = useConfig();
  const { globalFont } = useFontContext();

  const deferredMarkdown = useDeferredValue(markdown);
  const isStale = deferredMarkdown !== markdown;

  const template = TEMPLATES.find(t => t.id === config.activeTemplateId) ?? TEMPLATES[0];
  const styles = template.styles;

  useEffect(() => {
    loadHighlightTheme(config.font.codeTheme);
  }, [config.font.codeTheme]);

  // 使用 deferredMarkdown 而非 markdown 渲染预览
  const htmlContent = useMemo(() => {
    const isHtml = deferredMarkdown.trimStart().startsWith('<');
    const raw = isHtml ? deferredMarkdown : renderMarkdown(deferredMarkdown);
    return String(DOMPurify.sanitize(raw, PURIFY_CONFIG));
  }, [deferredMarkdown]);

  const cssVars = useMemo(
    () => getTemplateContentStyles(styles, config.font),
    [styles, config.font],
  );

  const hasTopBar = !!styles.topBarBg;

  // ─── 分页模式状态 ────────────────────────────────────────────────────────────
  const [pagedContents, setPagedContents] = useState<string[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reservedHeight = useMemo(() => {
    let height = 0;
    const padNum = parseFloat(CARD_PADDING) || 0;

    if (hasTopBar) {
      height += 30;
      height += padNum;
    } else {
      height += padNum * 2;
    }

    if (config.header.enabled) {
      switch (config.header.styleId) {
        case 'style2': height += 72; break;
        case 'style3': height += 102; break;
        default: height += 44; break;
      }
    }

    if (config.footer.enabled) {
      height += 54;
    }

    return height;
  }, [config.header.enabled, config.header.styleId, config.footer.enabled, hasTopBar]);

  useEffect(() => {
    if (config.pageMode !== 'paged') {
      setPagedContents([]);
      return;
    }

    const cacheKey = generatePagedContentsCacheKey(
      htmlContent,
      config.aspectRatio,
      reservedHeight,
      config.font.baseFontSize,
      config.font.lineHeight,
      globalFont,
      JSON.stringify(cssVars),
    );
    const cached = getPagedContentsCacheByKey(cacheKey);
    if (cached && cached.key === cacheKey) {
      setPagedContents(cached.contents);
      pageRefs.current = new Array(cached.contents.length).fill(null);
      return;
    }

    const timer = requestAnimationFrame(() => {
      const pageHeight = getPageHeight(config.aspectRatio);
      const result = splitContentIntoPages(
        htmlContent,
        pageHeight,
        reservedHeight,
        440,
        CARD_PADDING,
        config.font.baseFontSize,
        config.font.lineHeight,
        globalFont,
        cssVars as Record<string, string>,
      );
      setPagedContentsCache(cacheKey, result);
      setPagedContents(result);
      pageRefs.current = new Array(result.length).fill(null);
    });
    return () => cancelAnimationFrame(timer);
  }, [
    htmlContent,
    config.pageMode,
    config.aspectRatio,
    reservedHeight,
    config.font.baseFontSize,
    config.font.lineHeight,
    globalFont,
    cssVars,
  ]);

  const containerStyle = useMemo<React.CSSProperties>(() => ({
    background: styles.cardBg,
    border: styles.cardBorder ?? 'none',
    borderRadius: CARD_BORDER_RADIUS,
    padding: hasTopBar ? 0 : CARD_PADDING,
    boxShadow: styles.shadow ?? '0 2px 12px rgba(0,0,0,0.08)',
    position: 'relative',
    overflow: 'hidden',
    fontSize: `${config.font.baseFontSize * 15}px`,
    lineHeight: config.font.lineHeight,
    color: styles.textColor,
    fontFamily: globalFont,
    minWidth: '280px',
    maxWidth: '440px',
    width: '100%',
    opacity: isStale ? 0.7 : 1,
    filter: isStale ? 'blur(0.4px)' : 'none',
    transition: 'opacity 0.15s, filter 0.15s',
  }), [styles, config.font, globalFont, hasTopBar, isStale]);

  // ─── 公共 JSX：页头、页脚、水印（整页/分页共用） ──────────────────────────────
  const headerJsx = config.header.enabled ? (
    <CardHeader
      styleId={config.header.styleId}
      date={config.header.date}
      text={config.header.text}
      text2={config.header.text2}
      avatarUrl={config.header.avatarUrl}
      styles={styles}
    />
  ) : null;

  const footerJsx = config.footer.enabled ? (
    <CardFooter
      styleId={config.footer.styleId}
      qrcodeType={config.footer.qrcodeType}
      qrcodeValue={config.footer.qrcodeValue}
      text1={config.footer.text1}
      text2={config.footer.text2}
      styles={styles}
    />
  ) : null;

  const watermarkJsx = config.watermark.enabled && config.watermark.imageUrl ? (
    <WatermarkLayer
      imageUrl={config.watermark.imageUrl}
      opacity={config.watermark.opacity}
      position={config.watermark.position}
      scale={config.watermark.scale}
    />
  ) : null;

  // ─── macOS 风格顶部装饰栏 ────────────────────────────────────────────────────
  const topBarJsx = hasTopBar ? (
    <div style={{
      background: styles.topBarBg,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexShrink: 0,
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E', display: 'inline-block', flexShrink: 0 }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28CA41', display: 'inline-block', flexShrink: 0 }} />
    </div>
  ) : null;

  // ─── 奶油文件夹装饰条 ────────────────────────────────────────────────────────
  const decorationBarJsx = styles.decorationBar ? (
    <div style={{
      position: 'absolute',
      top: '14px',
      left: '14px',
      width: '40px',
      height: '10px',
      background: styles.decorationBar,
      borderRadius: '999px',
      zIndex: 3,
    }} />
  ) : null;

  // ─── hero 封面区 ──────────────────────────────────────────────────────────────
  const heroJsx = styles.heroBg ? (
    <div style={{
      background: styles.heroBg,
      borderRadius: '0',
      padding: '20px',
      marginBottom: '16px',
      textAlign: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        color: '#FFFFFF',
        fontSize: '1.4em',
        fontWeight: 700,
        lineHeight: 1.4,
      }}>{config.header.text}</div>
    </div>
  ) : null;

  // ─── 分页模式渲染 ────────────────────────────────────────────────────────────
  if (config.pageMode === 'paged') {
    const pageHeight = getPageHeight(config.aspectRatio);

    return (
      <div className="flex flex-col items-center gap-5 w-full" ref={previewRef}>
        <CardStyleEngine styles={styles} />
        {pagedContents.map((pageContent, i) => (
          <div
            key={i}
            ref={(el) => { pageRefs.current[i] = el; }}
            data-page-card
            style={{
              width: '440px',
              height: `${pageHeight}px`,
              background: styles.pageBg ?? styles.cardBg,
              border: styles.pageBg ? 'none' : (styles.cardBorder ?? 'none'),
              borderRadius: styles.pageBg ? '0' : CARD_BORDER_RADIUS,
              boxShadow: styles.pageBg ? 'none' : (styles.shadow ?? '0 2px 12px rgba(0,0,0,0.08)'),
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
              fontSize: `${config.font.baseFontSize * 15}px`,
              lineHeight: config.font.lineHeight,
              color: styles.textColor,
              fontFamily: globalFont,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: styles.pageBg ? '20px' : '0',
            }}
          >
            {styles.pageBg ? (
              <div style={{
                background: styles.cardBg,
                border: styles.cardBorder ?? 'none',
                borderRadius: CARD_BORDER_RADIUS,
                boxShadow: styles.shadow ?? '0 2px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                height: '100%',
                flexShrink: 0,
                fontSize: `${config.font.baseFontSize * 15}px`,
                lineHeight: config.font.lineHeight,
                color: styles.textColor,
                fontFamily: globalFont,
              }} className={styles.folderStyle ? 'card-folder' : ''}>
                {decorationBarJsx}
                <div style={{ padding: CARD_PADDING, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {headerJsx}
                  {heroJsx}
                  <div className="card-render flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: pageContent }} />
                  {footerJsx}
                  {watermarkJsx}
                </div>
              </div>
            ) : (
              <>
                {topBarJsx}
                <div style={{
                  ...(cssVars as React.CSSProperties),
                  height: hasTopBar ? `calc(100% - 30px)` : '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: hasTopBar ? `0 ${CARD_PADDING} ${CARD_PADDING}` : CARD_PADDING,
                }}>
                  {headerJsx}
                  <div className="card-render flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: pageContent }} />
                  {footerJsx}
                  {watermarkJsx}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ─── 整页模式渲染 ──────────────────────────────────────────────────────────
  const isFolderTemplate = !!styles.pageBg;

  return (
    <div style={isFolderTemplate ? {
      background: styles.pageBg,
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      minWidth: '280px',
      maxWidth: '480px',
      width: '100%',
    } : containerStyle} ref={previewRef}>
      <CardStyleEngine styles={styles} />

      {isFolderTemplate && (
        <div style={{
          background: styles.cardBg,
          border: styles.cardBorder ?? 'none',
          borderRadius: CARD_BORDER_RADIUS,
          boxShadow: styles.shadow ?? '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '440px',
          fontSize: `${config.font.baseFontSize * 15}px`,
          lineHeight: config.font.lineHeight,
          color: styles.textColor,
          fontFamily: globalFont,
          opacity: isStale ? 0.7 : 1,
          filter: isStale ? 'blur(0.4px)' : 'none',
          transition: 'opacity 0.15s, filter 0.15s',
        }} className={styles.folderStyle ? 'card-folder' : ''}>
          {decorationBarJsx}

          {/* PRO 角标 */}
          {styles.badgeBg && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              background: styles.badgeBg,
              color: 'white',
              borderRadius: '0',
              padding: '4px 14px',
              fontSize: '0.85em',
              fontWeight: 700,
              zIndex: 3,
            }}>Pro</div>
          )}

          <div style={{ padding: CARD_PADDING }}>
            {headerJsx}
            {heroJsx}
            <div className="card-render" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            {footerJsx}
            {watermarkJsx}
          </div>
        </div>
      )}

      {!isFolderTemplate && (
        <>
          {topBarJsx}
          <div style={{ ...(cssVars as React.CSSProperties), ...(hasTopBar ? { padding: CARD_PADDING } : {}) }}>
            {headerJsx}
            <div className="card-render" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            {footerJsx}
            {watermarkJsx}
          </div>
        </>
      )}
    </div>
  );
};

export default CardPreview;
