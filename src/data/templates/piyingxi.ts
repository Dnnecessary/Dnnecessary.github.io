import type { CardTemplate } from '@/types/card';

// 皮影戏：宣纸底色、藏蓝主色、金黄点缀、中式排版与装饰线
const piyingxi: CardTemplate = {
  id: 'piyingxi',
  name: '皮影戏',
  category: 'recommended',
  styles: {
    // 基础配色
    cardBg: '#F7F4EE',
    cardBorder: 'none',
    titleColor: '#234A83',
    textColor: '#304B75',
    accentColor: '#D4A12A',
    // 列表
    listNumberBg: '#234A83',
    listNumberColor: '#FFFFFF',
    bulletColor: '#D4A12A',
    // 引用块：▌前缀中式风格
    blockquoteBorder: '#234A83',
    blockquoteBg: '#E9EDF3',
    blockquoteText: '#304B75',
    blockquoteStyle: 'traditional',
    // 代码
    codeBg: '#E9EDF3',
    codeText: '#234A83',
    // 页头页脚
    headerDateColor: '#667892',
    headerTextColor: '#667892',
    dividerColor: '#BFC9D7',
    // 卡片：直角、粗边框、轻阴影
    shadow: '0 2px 12px rgba(35,74,131,0.08)',
    // H1：藏蓝大字 + 全宽金色装饰线
    titleDecorationBar: true,
    titleDecorationBarFullWidth: true,
    // H2：线穿样式 ──── 标题 ────
    h2LineStyle: true,
    // H3：浅蓝灰背景标签
    h3BannerBg: '#E7EBF1',
    h3Color: '#234A83',
    // 斜体：深金色
    emColor: '#B5841B',
    // 高亮：古书批注黄
    markBg: '#F5E7B8',
    // 链接：金色
    linkColor: '#D4A12A',
  },
};

export default piyingxi;
