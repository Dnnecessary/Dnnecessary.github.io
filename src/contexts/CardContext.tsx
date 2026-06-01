// @refresh reset
/**
 * 状态管理：拆分为三个独立 Context，避免「上帝 Context」导致全量重渲。
 *
 * MarkdownContext  — 仅 markdown/setMarkdown
 *   消费者：EditorPanel、CardPreview
 *
 * ConfigContext   — CardConfig + 所有 setter
 *   消费者：CustomizePanel、TemplatePanel、WidgetsPanel、CardPreview
 *
 * FontContext     — globalFont/setGlobalFont
 *   消费者：EditorPanel、CardPreview
 *
 * 击键只触发 MarkdownContext 订阅者重渲（EditorPanel + CardPreview），
 * 调字体/模板/小组件时不影响编辑器，互不干扰。
 *
 * useCardStore() 兼容层合并三个 hook，现有代码零改动即可使用。
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CardConfig, PageMode, WatermarkPosition } from '@/types/card';
import { DEFAULT_MARKDOWN } from '@/types/card';
import { BUILTIN_FONTS } from '@/hooks/useFontManager';

// ─── 公共类型 ─────────────────────────────────────────────────────────────────

export interface ConfigStore {
  config: CardConfig;
  setPageMode: (m: PageMode) => void;
  setBaseFontSize: (v: number) => void;
  setLineHeight: (v: number) => void;
  setTitleLinked: (v: boolean) => void;
  setTitleFontSize: (v: number) => void;
  setTableLinked: (v: boolean) => void;
  setTableFontSize: (v: number) => void;
  setCodeTheme: (v: string) => void;
  setHeaderEnabled: (v: boolean) => void;
  setHeaderStyleId: (v: string) => void;
  setHeaderDate: (v: string) => void;
  setHeaderText: (v: string) => void;
  setHeaderText2: (v: string) => void;
  setHeaderAvatarUrl: (v: string) => void;
  setFooterEnabled: (v: boolean) => void;
  setFooterStyleId: (v: string) => void;
  setFooterQrcodeType: (v: 'link' | 'text') => void;
  setFooterQrcodeValue: (v: string) => void;
  setFooterText1: (v: string) => void;
  setFooterText2: (v: string) => void;
  setWatermarkEnabled: (v: boolean) => void;
  setWatermarkImageUrl: (v: string) => void;
  setWatermarkOpacity: (v: number) => void;
  setWatermarkPosition: (v: WatermarkPosition) => void;
  setWatermarkScale: (v: number) => void;
  setActiveTemplate: (id: string) => void;
}

export interface MarkdownStore {
  markdown: string;
  setMarkdown: (v: string) => void;
}

export interface FontStore {
  globalFont: string;
  setGlobalFont: (family: string) => void;
}

// 兼容层：合并三个 slice，现有 useCardStore() 调用者无需修改
export type CardStore = MarkdownStore & ConfigStore & FontStore;

// ─── 默认值 ──────────────────────────────────────────────────────────────────

const DEFAULT_FONT = BUILTIN_FONTS[0].family; // 思源黑体

/**
 * 在 Provider 首次挂载时获取当日日期，而非模块加载时。
 * 模块级 `new Date()` 在 HMR / SSR / 长开 Tab 场景下会固化为旧日期；
 * 使用惰性初始化函数确保每次应用实际启动时都取当天日期。
 */
function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const defaultConfig: CardConfig = {
  pageMode: 'full',
  font: {
    baseFontSize: 1.0,
    lineHeight: 1.6,
    titleLinked: true,
    titleFontSize: 1.4,
    tableLinked: true,
    tableFontSize: 0.9,
    codeTheme: 'dark',
  },
  header: {
    enabled: true,
    styleId: 'style1',
    date: '',   // 由 CardProvider 惰性初始化注入真实日期
    text: '墨迹文卡',
    text2: '极简易用的图文美化工具',
    avatarUrl: '',
  },
  footer: {
    enabled: true,
    styleId: 'style1',
    qrcodeType: 'link',
    qrcodeValue: 'https://example.com',
    text1: '墨迹文卡',
    text2: '极简易用的图文美化工具',
  },
  watermark: {
    enabled: false,
    imageUrl: '',
    opacity: 0.2,
    position: 'bottom-right',
    scale: 0.3,
  },
  activeTemplateId: 'warm-parchment',
};

// ─── Context 定义 ─────────────────────────────────────────────────────────────

const MarkdownContext = createContext<MarkdownStore | null>(null);
const ConfigContext   = createContext<ConfigStore | null>(null);
const FontContext     = createContext<FontStore | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  // useState 惰性初始化：() => {...} 仅在 Provider 首次挂载时执行一次，
  // 确保 header.date 取的是应用实际开启时的当天日期，而非模块加载时的日期。
  const [config, setConfig] = useState<CardConfig>(() => ({
    ...defaultConfig,
    header: { ...defaultConfig.header, date: getTodayStr() },
  }));
  const [globalFont, setGlobalFont] = useState(DEFAULT_FONT);

  const update = useCallback((fn: (c: CardConfig) => CardConfig) => {
    setConfig(prev => fn(prev));
  }, []);

  // ─── 稳定化 setter（依赖稳定的 update，不依赖 config）────────────────────────
  // 将所有 setter 提取为独立 useCallback，确保引用不随 config 变化而重建，
  // 避免每次调整滑块/开关时重建 ~20 个箭头函数，减少子组件不必要的 props 变化。
  const setPageMode          = useCallback((m: PageMode)           => update(c => ({ ...c, pageMode: m })), [update]);
  const setBaseFontSize      = useCallback((v: number)             => update(c => ({ ...c, font: { ...c.font, baseFontSize: v } })), [update]);
  const setLineHeight        = useCallback((v: number)             => update(c => ({ ...c, font: { ...c.font, lineHeight: v } })), [update]);
  const setTitleLinked       = useCallback((v: boolean)            => update(c => ({ ...c, font: { ...c.font, titleLinked: v } })), [update]);
  const setTitleFontSize     = useCallback((v: number)             => update(c => ({ ...c, font: { ...c.font, titleFontSize: v } })), [update]);
  const setTableLinked       = useCallback((v: boolean)            => update(c => ({ ...c, font: { ...c.font, tableLinked: v } })), [update]);
  const setTableFontSize     = useCallback((v: number)             => update(c => ({ ...c, font: { ...c.font, tableFontSize: v } })), [update]);
  const setCodeTheme         = useCallback((v: string)             => update(c => ({ ...c, font: { ...c.font, codeTheme: v } })), [update]);
  const setHeaderEnabled     = useCallback((v: boolean)            => update(c => ({ ...c, header: { ...c.header, enabled: v } })), [update]);
  const setHeaderStyleId     = useCallback((v: string)             => update(c => ({ ...c, header: { ...c.header, styleId: v } })), [update]);
  const setHeaderDate        = useCallback((v: string)             => update(c => ({ ...c, header: { ...c.header, date: v } })), [update]);
  const setHeaderText        = useCallback((v: string)             => update(c => ({ ...c, header: { ...c.header, text: v } })), [update]);
  const setHeaderText2       = useCallback((v: string)             => update(c => ({ ...c, header: { ...c.header, text2: v } })), [update]);
  const setHeaderAvatarUrl   = useCallback((v: string)             => update(c => ({ ...c, header: { ...c.header, avatarUrl: v } })), [update]);
  const setFooterEnabled     = useCallback((v: boolean)            => update(c => ({ ...c, footer: { ...c.footer, enabled: v } })), [update]);
  const setFooterStyleId     = useCallback((v: string)             => update(c => ({ ...c, footer: { ...c.footer, styleId: v } })), [update]);
  const setFooterQrcodeType  = useCallback((v: 'link' | 'text')   => update(c => ({ ...c, footer: { ...c.footer, qrcodeType: v } })), [update]);
  const setFooterQrcodeValue = useCallback((v: string)             => update(c => ({ ...c, footer: { ...c.footer, qrcodeValue: v } })), [update]);
  const setFooterText1       = useCallback((v: string)             => update(c => ({ ...c, footer: { ...c.footer, text1: v } })), [update]);
  const setFooterText2       = useCallback((v: string)             => update(c => ({ ...c, footer: { ...c.footer, text2: v } })), [update]);
  const setWatermarkEnabled  = useCallback((v: boolean)            => update(c => ({ ...c, watermark: { ...c.watermark, enabled: v } })), [update]);
  const setWatermarkImageUrl = useCallback((v: string)             => update(c => ({ ...c, watermark: { ...c.watermark, imageUrl: v } })), [update]);
  const setWatermarkOpacity  = useCallback((v: number)             => update(c => ({ ...c, watermark: { ...c.watermark, opacity: v } })), [update]);
  const setWatermarkPosition = useCallback((v: WatermarkPosition)  => update(c => ({ ...c, watermark: { ...c.watermark, position: v } })), [update]);
  const setWatermarkScale    = useCallback((v: number)             => update(c => ({ ...c, watermark: { ...c.watermark, scale: v } })), [update]);
  const setActiveTemplate    = useCallback((id: string)            => update(c => ({ ...c, activeTemplateId: id })), [update]);

  // ConfigStore：config 变化时重建，但所有 setter 引用稳定（不因 config 变化而重建）
  const configStore: ConfigStore = useMemo(() => ({
    config,
    setPageMode, setBaseFontSize, setLineHeight,
    setTitleLinked, setTitleFontSize, setTableLinked, setTableFontSize, setCodeTheme,
    setHeaderEnabled, setHeaderStyleId, setHeaderDate, setHeaderText, setHeaderText2, setHeaderAvatarUrl,
    setFooterEnabled, setFooterStyleId, setFooterQrcodeType, setFooterQrcodeValue, setFooterText1, setFooterText2,
    setWatermarkEnabled, setWatermarkImageUrl, setWatermarkOpacity, setWatermarkPosition, setWatermarkScale,
    setActiveTemplate,
  }), [
    config,
    setPageMode, setBaseFontSize, setLineHeight,
    setTitleLinked, setTitleFontSize, setTableLinked, setTableFontSize, setCodeTheme,
    setHeaderEnabled, setHeaderStyleId, setHeaderDate, setHeaderText, setHeaderText2, setHeaderAvatarUrl,
    setFooterEnabled, setFooterStyleId, setFooterQrcodeType, setFooterQrcodeValue, setFooterText1, setFooterText2,
    setWatermarkEnabled, setWatermarkImageUrl, setWatermarkOpacity, setWatermarkPosition, setWatermarkScale,
    setActiveTemplate,
  ]);

  // MarkdownStore：仅在 markdown 变化时重建（击键场景）
  const markdownStore: MarkdownStore = useMemo(() => ({
    markdown,
    setMarkdown,
  }), [markdown]);

  // FontStore：仅在 globalFont 变化时重建
  const fontStore: FontStore = useMemo(() => ({
    globalFont,
    setGlobalFont,
  }), [globalFont]);

  return (
    <MarkdownContext.Provider value={markdownStore}>
      <ConfigContext.Provider value={configStore}>
        <FontContext.Provider value={fontStore}>
          {children}
        </FontContext.Provider>
      </ConfigContext.Provider>
    </MarkdownContext.Provider>
  );
};

// ─── 精细化 Hook ──────────────────────────────────────────────────────────────

const noop = () => {};

/** 仅订阅 markdown，击键时只重渲编辑器和预览 */
export const useMarkdown = (): MarkdownStore => {
  const ctx = useContext(MarkdownContext);
  if (!ctx) {
    if (!import.meta.env.DEV) throw new Error('useMarkdown must be used within CardProvider');
    return { markdown: '', setMarkdown: noop };
  }
  return ctx;
};

/** 仅订阅 config，调模板/字体/小组件时重渲相关面板 */
export const useConfig = (): ConfigStore => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    if (!import.meta.env.DEV) throw new Error('useConfig must be used within CardProvider');
    return {
      config: defaultConfig,
      setPageMode: noop, setBaseFontSize: noop, setLineHeight: noop,
      setTitleLinked: noop, setTitleFontSize: noop, setTableLinked: noop,
      setTableFontSize: noop, setCodeTheme: noop, setHeaderEnabled: noop,
      setHeaderStyleId: noop, setHeaderDate: noop, setHeaderText: noop,
      setHeaderText2: noop, setHeaderAvatarUrl: noop, setFooterEnabled: noop,
      setFooterStyleId: noop, setFooterQrcodeType: noop, setFooterQrcodeValue: noop,
      setFooterText1: noop, setFooterText2: noop, setWatermarkEnabled: noop,
      setWatermarkImageUrl: noop, setWatermarkOpacity: noop, setWatermarkPosition: noop,
      setWatermarkScale: noop, setActiveTemplate: noop,
    };
  }
  return ctx;
};

/** 仅订阅 globalFont */
export const useFontContext = (): FontStore => {
  const ctx = useContext(FontContext);
  if (!ctx) {
    if (!import.meta.env.DEV) throw new Error('useFontContext must be used within CardProvider');
    return { globalFont: DEFAULT_FONT, setGlobalFont: noop };
  }
  return ctx;
};

// ─── 兼容层 ───────────────────────────────────────────────────────────────────

/**
 * 向后兼容：合并三个独立 Context 的值。
 * 消费全量字段时会同时订阅三个 Context，任意 slice 变化都触发重渲。
 * 推荐新增组件直接使用 useMarkdown / useConfig / useFontContext 精细订阅。
 */
export const useCardStore = (): CardStore => {
  const markdown = useMarkdown();
  const config   = useConfig();
  const font     = useFontContext();
  return useMemo(() => ({ ...markdown, ...config, ...font }), [markdown, config, font]);
};
