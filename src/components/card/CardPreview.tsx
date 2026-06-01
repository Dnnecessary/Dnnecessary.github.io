import React, { useEffect, useState, useDeferredValue, useMemo } from 'react';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';
import { useMarkdown, useConfig, useFontContext } from '@/contexts/CardContext';
import { TEMPLATES } from '@/data/templates';
import { renderMarkdown, getTemplateContentStyles } from '@/lib/markdownRenderer';
import type { TemplateStyles } from '@/types/card';
import QRCode from 'qrcode';

/**
 * highlight.js 代码主题加载：主 CDN + 备用 CDN 双降级。
 * 避免使用 ?raw 静态导入（与平台 Vite 插件存在兼容问题，会导致模块初始化失败）。
 */
const CODE_THEME_URLS: Record<string, string[]> = {
  dark:      [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-dark.min.css',
  ],
  light:     [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-light.min.css',
  ],
  github:    [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css',
  ],
  monokai:   [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/monokai.min.css',
  ],
  solarized: [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/solarized-dark.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/base16/solarized-dark.min.css',
  ],
};

/**
 * highlight.js 代码主题加载：主 CDN + 备用 CDN 双降级。
 * 避免使用 ?raw 静态导入（与平台 Vite 插件存在兼容问题，会导致模块初始化失败）。
 *
 * 并发安全：每次调用生成独立 `active` 标志。主题切换时，上一次的回调检测到
 * `active === false` 后立即停止重试，避免多次并发调用互相覆盖 onerror 导致
 * 降级重试链断裂（场景：用户快速连续切换代码主题）。
 */
let _currentThemeHandle: { cancel: () => void } | null = null;

function loadHighlightTheme(theme: string) {
  // 取消上一次尚未完成的重试链
  if (_currentThemeHandle) {
    _currentThemeHandle.cancel();
    _currentThemeHandle = null;
  }

  const urls = CODE_THEME_URLS[theme] ?? CODE_THEME_URLS.dark;
  const id = 'hljs-theme';
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = 'stylesheet';
    document.head.appendChild(el);
  }

  // 每次调用独立的 active 标志，旧调用的回调在 cancel() 后不再继续
  let active = true;
  _currentThemeHandle = { cancel: () => { active = false; } };

  let idx = 0;
  const tryNext = () => {
    if (!active || idx >= urls.length) return;
    el!.href = urls[idx];
    el!.onerror = () => { if (active) { idx++; tryNext(); } };
    idx++;
  };
  tryNext();
}

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
  ALLOWED_ATTR: ['href','src','alt','class','style','target','rel','width','height'],
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

/**
 * 校验 CSS 颜色值格式，防止模板颜色值中包含 `}` 等字符破出 CSS 规则。
 * 允许：hex / rgb() / rgba() / hsl() / hsla() / 8位hex
 * 不合法时返回 fallback（默认 transparent）。
 */
const CSS_COLOR_RE = /^(#([0-9a-fA-F]{3,8})|(rgba?|hsla?)\([^)]{1,80}\))$/;
function sc(val: string | undefined, fallback = 'transparent'): string {
  if (!val) return fallback;
  const v = val.trim();
  return CSS_COLOR_RE.test(v) ? v : fallback;
}

interface CardHeaderProps {
  styleId: string;
  date: string;
  text: string;
  text2?: string;
  avatarUrl?: string;
  styles: TemplateStyles;
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '--', yearMonth: '', chinese: '' };
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const chineseDay = String(d.getDate()).padStart(2, '0');
  return {
    day,
    yearMonth: `${year}/${month}`,
    chinese: `${year}年${month}月${chineseDay}日`,
  };
}

const CardHeader: React.FC<CardHeaderProps> = ({ styleId, date, text, text2, avatarUrl, styles }) => {
  const { day, yearMonth, chinese } = parseDate(date);

  // style2：日期 + 文本（大日期数字左 + 年/月 + 文本右）
  if (styleId === 'style2') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '10px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: '700', color: styles.headerDateColor, lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: '0.78em', color: styles.headerDateColor, opacity: 0.8, marginTop: '2px' }}>{yearMonth}</div>
        </div>
        <div style={{ fontSize: '0.85em', color: styles.headerTextColor, fontWeight: '500' }}>{text}</div>
      </div>
    );
  }

  // style3：LOGO + 日期（圆形头像上方 + 中文日期下方）
  if (styleId === 'style3') {
    return (
      <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: `${styles.listNumberBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', flexShrink: 0 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '0.65em', color: styles.headerTextColor, opacity: 0.5 }}>头像</span>
          }
        </div>
        <div style={{ fontSize: '0.85em', color: styles.headerDateColor, fontWeight: '500' }}>{chinese}</div>
      </div>
    );
  }

  // style1（默认）：文本 + 文本（左文本 + 右文本，无日期）
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
      <div style={{ fontSize: '0.9em', fontWeight: '600', color: styles.headerDateColor }}>{text}</div>
      <div style={{ fontSize: '0.85em', color: styles.headerTextColor, opacity: 0.8 }}>{text2 ?? ''}</div>
    </div>
  );
};

interface CardFooterProps {
  styleId: string;
  qrcodeType: 'link' | 'text';
  qrcodeValue: string;
  text1: string;
  text2: string;
  styles: TemplateStyles;
}

const CardFooter: React.FC<CardFooterProps> = ({ styleId, qrcodeValue, text1, text2, styles }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!qrcodeValue) return;
    let cancelled = false;
    QRCode.toDataURL(qrcodeValue, { width: 80, margin: 1, color: { dark: styles.textColor, light: 'transparent' } })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [qrcodeValue, styles.textColor]);

  if (styleId === 'style3') {
    // 纯文字样式
    return (
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, textAlign: 'center' }}>
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.75em', color: styles.textColor, opacity: 0.7, marginTop: '2px' }}>{text2}</div>}
      </div>
    );
  }

  if (styleId === 'style2') {
    // 二维码居中
    return (
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        {qrDataUrl && <img src={qrDataUrl} alt="QR码" style={{ width: '56px', height: '56px' }} />}
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.72em', color: styles.textColor, opacity: 0.7 }}>{text2}</div>}
      </div>
    );
  }

  // style1: 默认二维码左置
  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, display: 'flex', alignItems: 'center', gap: '10px' }}>
      {qrDataUrl && <img src={qrDataUrl} alt="QR码" style={{ width: '48px', height: '48px', flexShrink: 0 }} />}
      <div>
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.72em', color: styles.textColor, opacity: 0.7, marginTop: '2px' }}>{text2}</div>}
      </div>
    </div>
  );
};

interface CardPreviewProps {
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

const CardPreview: React.FC<CardPreviewProps> = ({ previewRef }) => {
  const { markdown } = useMarkdown();
  const { config } = useConfig();
  const { globalFont } = useFontContext();

  // useDeferredValue：让预览渲染降低优先级，避免每次击键都阻塞编辑器输入
  // React 18 会优先完成高优先级的输入更新，再以"过期"值更新预览
  const deferredMarkdown = useDeferredValue(markdown);
  // isStale：deferredMarkdown 还未追上最新 markdown，预览正在等待更新
  const isStale = deferredMarkdown !== markdown;

  const template = TEMPLATES.find(t => t.id === config.activeTemplateId) ?? TEMPLATES[0];
  const styles = template.styles;

  useEffect(() => {
    loadHighlightTheme(config.font.codeTheme);
  }, [config.font.codeTheme]);

  // 使用 deferredMarkdown 而非 markdown 渲染预览，输入不会被预览渲染阻塞
  // useMemo：deferredMarkdown 不变时跳过 md.render + DOMPurify 扫描
  // （切换模板、调整字体、开关水印等不改变 markdown，命中缓存直接复用）
  const htmlContent = useMemo(() => {
    const isHtml = deferredMarkdown.trimStart().startsWith('<');
    const raw = isHtml ? deferredMarkdown : renderMarkdown(deferredMarkdown);
    return String(DOMPurify.sanitize(raw, PURIFY_CONFIG));
  }, [deferredMarkdown]);

  // cssVars：styles 和 config.font 不变时跳过重计算，避免每帧新建对象触发子组件 style 更新
  const cssVars = useMemo(
    () => getTemplateContentStyles(styles, config.font),
    [styles, config.font],
  );

  const hasTopBar = !!styles.topBarBg;

  // containerStyle：所有依赖项不变时引用稳定，避免每帧触发 DOM style 更新
  const containerStyle = useMemo<React.CSSProperties>(() => ({
    background: styles.cardBg,
    border: styles.cardBorder ?? 'none',
    borderRadius: styles.borderRadius,
    padding: hasTopBar ? 0 : styles.padding,
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

  // 引用块：classic = 传统左边线右圆角；pill = 圆头竖线（默认）
  // useMemo：styles/font 不变时跳过 CSS 字符串重建，避免每次击键都触发 <style> DOM 更新
  const contentStyleTag = useMemo(() => {
    const blockquoteBg = sc(styles.blockquoteBg, '#F5F5F5');
    const blockquoteCSS = styles.blockquoteStyle === 'classic'
      ? `
    .card-render blockquote { border-left: 5px solid ${sc(styles.blockquoteBorder)}; background: ${blockquoteBg}; padding: 16px 20px; margin: 10px 0; border-radius: 0 4px 4px 0; }
    .card-render blockquote::before { display: none; }
    .card-render blockquote p { color: ${sc(styles.blockquoteText ?? styles.textColor)}; font-style: normal; margin: 0; }`
      : `
    .card-render blockquote { position: relative; padding: 12px 16px 12px 22px; margin: 10px 0; background: ${blockquoteBg}; border-radius: 8px; overflow: hidden; }
    .card-render blockquote::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: ${sc(styles.blockquoteBorder)}; border-radius: 0 3px 3px 0; }
    .card-render blockquote p { color: ${sc(styles.blockquoteText ?? styles.textColor)}; font-style: normal; margin: 0; }`;

    const titleBarCSS = styles.titleDecorationBar
      ? `
    .card-render h1::after { content: ""; display: block; width: 40px; height: 4px; background: ${sc(styles.accentColor)}; margin-top: 8px; border-radius: 2px; }
    .card-render h2::after { content: ""; display: block; width: 32px; height: 3px; background: ${sc(styles.accentColor)}; margin-top: 6px; border-radius: 2px; }`
      : '';

    const bulletCSS = styles.bulletShape === 'square'
      ? `.card-render ul li::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 0; background: ${sc(styles.bulletColor)}; margin-top: calc(0.8em - 3px); flex-shrink: 0; }`
      : `.card-render ul li::before { content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${sc(styles.bulletColor)}; margin-top: calc(0.8em - 3px); flex-shrink: 0; }`;

    const h1Style = styles.titleBannerBg
      ? `background: ${sc(styles.titleBannerBg)}; color: ${sc(styles.titleBannerTextColor, '#FFFFFF')}; border-radius: 8px; padding: 12px 20px; text-align: center; font-weight: 700; margin: 12px 0 14px; font-size: var(--tpl-title-size); line-height: 1.4;`
      : `color: ${sc(styles.titleColor)}; font-size: var(--tpl-title-size); font-weight: 700; margin: 12px 0 6px;`;

    return `
    .card-render h1 { ${h1Style} }
    .card-render h2 { color: ${sc(styles.h2Color ?? styles.titleColor)}; font-size: var(--tpl-h2-size); font-weight: 600; margin: 10px 0 5px; }
    .card-render h3 { color: ${sc(styles.h3Color ?? styles.h2Color ?? styles.titleColor)}; font-size: var(--tpl-h3-size); font-weight: 600; margin: 8px 0 4px; }
    ${titleBarCSS}
    .card-render p { margin: 5px 0; color: ${sc(styles.textColor)}; }
    .card-render strong { color: ${sc(styles.accentColor)}; font-weight: 700; }
    .card-render em { font-style: italic; ${styles.emColor ? `color: ${sc(styles.emColor)};` : ''} }
    .card-render del, .card-render s { ${styles.strikethroughColor ? `color: ${sc(styles.strikethroughColor)};` : ''} }
    .card-render ul { list-style: none; padding-left: 0; margin: 6px 0; }
    .card-render ul li { display: flex; align-items: flex-start; gap: 10px; margin: 9px 0; color: ${sc(styles.textColor)}; }
    ${bulletCSS}
    .card-render ol { list-style: none; padding-left: 0; margin: 6px 0; counter-reset: ol-counter; }
    .card-render ol li { counter-increment: ol-counter; display: flex; align-items: flex-start; gap: 6px; margin: 7px 0; color: ${sc(styles.textColor)}; }
    .card-render ol li::before { content: counter(ol-counter) "."; color: ${sc(styles.olNumberColor ?? styles.textColor)}; font-size: 1em; font-weight: 600; flex-shrink: 0; line-height: 1.5; min-width: 1.4em; }
    .card-render li > p { margin: 0; padding: 0; display: inline; }
    ${blockquoteCSS}
    .card-render code { background: ${sc(styles.codeBg)}; color: ${sc(styles.codeText)}; border-radius: 3px; padding: 1px 5px; font-size: 0.875em; font-family: 'Fira Code', 'Consolas', monospace; }
    .card-render .hljs-pre { background: ${sc(styles.codeBg)}; border-radius: 6px; padding: 12px; margin: 8px 0; overflow-x: auto; }
    .card-render .hljs-pre code { background: transparent; padding: 0; color: ${sc(styles.codeText)}; font-size: var(--tpl-table-size); }
    .card-render table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: var(--tpl-table-size); }
    .card-render table th { background: ${sc(styles.listNumberBg)}22; color: ${sc(styles.titleColor)}; border: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; padding: 6px 10px; font-weight: 600; }
    .card-render table td { border: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; padding: 5px 10px; color: ${sc(styles.textColor)}; }
    .card-render hr { border: none; border-top: 1px solid ${sc(styles.dividerColor ?? styles.textColor)}30; margin: 12px 0; }
    .card-render a { color: ${sc(styles.linkColor ?? styles.accentColor)}; text-decoration: underline; }
    .card-render img { max-width: 100%; border-radius: 6px; }
  `;
  }, [styles, config.font]);

  return (
    // isStale 时轻微降低透明度 + 轻微模糊，告知用户预览正在追赶最新内容
    // opacity/filter/transition 已内嵌在 containerStyle 的 useMemo 中
    <div style={containerStyle} ref={previewRef}>
      <style>{contentStyleTag}</style>

      {/* 立体模板顶部装饰栏 */}
      {hasTopBar && (
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
      )}

      <div
        style={{ ...(cssVars as React.CSSProperties), ...(hasTopBar ? { padding: styles.padding } : {}) }}
      >
        {/* 页头 */}
        {config.header.enabled && (
          <CardHeader
            styleId={config.header.styleId}
            date={config.header.date}
            text={config.header.text}
            text2={config.header.text2}
            avatarUrl={config.header.avatarUrl}
            styles={styles}
          />
        )}

        {/* 正文内容 */}
        <div
          className="card-render"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* 页脚 */}
        {config.footer.enabled && (
          <CardFooter
            styleId={config.footer.styleId}
            qrcodeType={config.footer.qrcodeType}
            qrcodeValue={config.footer.qrcodeValue}
            text1={config.footer.text1}
            text2={config.footer.text2}
            styles={styles}
          />
        )}

        {/* 水印 */}
        {config.watermark.enabled && config.watermark.imageUrl && (
          <WatermarkLayer
            imageUrl={config.watermark.imageUrl}
            opacity={config.watermark.opacity}
            position={config.watermark.position}
            scale={config.watermark.scale}
          />
        )}
      </div>
    </div>
  );
};

interface WatermarkLayerProps {
  imageUrl: string;
  opacity: number;
  position: string;
  scale: number;
}

const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ imageUrl, opacity, position, scale }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    tile: { top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${imageUrl})`, backgroundRepeat: 'repeat', backgroundSize: `${scale * 120}px` },
  };

  if (position === 'tile') {
    return (
      <div
        style={{
          position: 'absolute',
          ...positionStyles.tile,
          opacity,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt="水印"
      style={{
        position: 'absolute',
        ...positionStyles[position],
        opacity,
        pointerEvents: 'none',
        zIndex: 10,
        width: `${scale * 100}%`,
        maxWidth: '200px',
      }}
    />
  );
};

export default CardPreview;
