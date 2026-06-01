// 墨迹文卡 - 核心类型定义

export type PageMode = 'full' | 'paged';
export type WatermarkPosition = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'tile';
export type ExportFormat = 'png' | 'jpg';
export type ExportQuality = 'hd' | 'ultra' | 'extreme' | 'pro';

export interface HeaderStyle {
  id: string;
  name: string;
}

export interface FooterStyle {
  id: string;
  name: string;
}

export interface CardHeaderConfig {
  enabled: boolean;
  styleId: string;
  date: string;
  text: string;
  text2?: string;      // style1 右侧文本 / style2 已弃用
  avatarUrl?: string;  // style3 头像图片 URL
}

export interface CardFooterConfig {
  enabled: boolean;
  styleId: string;
  qrcodeType: 'link' | 'text';
  qrcodeValue: string;
  text1: string;
  text2: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  imageUrl: string;
  opacity: number;
  position: WatermarkPosition;
  scale: number;
}

export interface FontConfig {
  baseFontSize: number;
  lineHeight: number;
  titleLinked: boolean;
  titleFontSize: number;
  tableLinked: boolean;
  tableFontSize: number;
  codeTheme: string;
}

export interface CardConfig {
  pageMode: PageMode;
  font: FontConfig;
  header: CardHeaderConfig;
  footer: CardFooterConfig;
  watermark: WatermarkConfig;
  activeTemplateId: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  styles: TemplateStyles;
}

export type TemplateCategory = 'recommended' | 'all' | 'solid' | 'minimal' | 'creative' | 'academic' | 'business' | 'custom';

export interface TemplateStyles {
  cardBg: string;
  cardBorder?: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
  listNumberBg: string;
  listNumberColor: string;
  bulletColor: string;
  blockquoteBorder: string;
  blockquoteText?: string;
  codeBg: string;
  codeText: string;
  headerDateColor: string;
  headerTextColor: string;
  footerBg?: string;
  footerText?: string;
  dividerColor?: string;
  padding: string;
  borderRadius: string;
  shadow?: string;
  backgroundPattern?: string;
  // 标题 Banner 样式（苔笺、立体等模板 H1 使用全宽带背景 Banner）
  titleBannerBg?: string;
  titleBannerTextColor?: string;
  // H2 单独颜色（立体模板 H2 用橙色）
  h2Color?: string;
  // H3 单独颜色
  h3Color?: string;
  // 顶部装饰栏背景色（立体模板 macOS 风格顶栏）
  topBarBg?: string;
  // 引用块样式：pill = 圆头竖线（默认），classic = 传统左边线右圆角
  blockquoteStyle?: 'pill' | 'classic';
  // 引用块背景色（单独覆盖）
  blockquoteBg?: string;
  // 标题下方装饰短横线（杂志风格）
  titleDecorationBar?: boolean;
  // 列表符号形状：circle = 圆形（默认），square = 实心方块
  bulletShape?: 'circle' | 'square';
  // 斜体颜色
  emColor?: string;
  // 删除线颜色
  strikethroughColor?: string;
  // 有序列表数字颜色（不设则继承 textColor）
  olNumberColor?: string;
  // 超链接颜色（不设则继承 accentColor）
  linkColor?: string;
}

export const CODE_THEMES = [
  { id: 'dark', name: '深色主题' },
  { id: 'light', name: '浅色主题' },
  { id: 'github', name: 'GitHub 主题' },
  { id: 'monokai', name: 'Monokai 主题' },
  { id: 'solarized', name: '日光主题' },
];

export const HEADER_STYLES: HeaderStyle[] = [
  { id: 'style1', name: '文本 + 文本' },
  { id: 'style2', name: '日期 + 文本' },
  { id: 'style3', name: 'LOGO + 日期' },
];

export const FOOTER_STYLES: FooterStyle[] = [
  { id: 'style1', name: '样式一：二维码左置' },
  { id: 'style2', name: '样式二：二维码居中' },
  { id: 'style3', name: '样式三：纯文字' },
];

export const DEFAULT_MARKDOWN = `<h1>欢迎使用墨迹文卡</h1><p>一个简单、优雅的文字卡片制作工具</p><h2>快速开始</h2><ol><li><p>在左侧编辑器输入或粘贴内容</p></li><li><p>选择喜欢的模板样式</p></li><li><p>一键导出精美卡片</p></li></ol><h2>支持功能</h2><ul><li><p><strong>富文本编辑</strong>：所见即所得，无需了解语法</p></li><li><p><strong>代码高亮</strong>：支持多种编程语言</p></li><li><p><strong>图片插入</strong>：粘贴或点击工具栏插入图片</p></li><li><p><strong>斜杠菜单</strong>：输入 / 快速插入任意块元素</p></li></ul><blockquote><p>开始你的创作之旅吧！</p></blockquote>`;
