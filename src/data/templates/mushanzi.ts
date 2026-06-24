import type { CardTemplate } from '@/types/card';

// 暮山紫：淡紫灰底、深紫标题、玫红点缀、优雅文艺风
// 适合读书笔记、诗歌摘抄、文艺随笔
const mushanzi: CardTemplate = {
  id: 'mushanzi',
  name: '暮山紫',
  category: 'recommended',
  styles: {
    // 卡片基础
    cardBg: '#F7F2FA',
    cardBorder: 'none',
    shadow: '0 4px 24px rgba(91,58,122,0.08)',

    // 标题层次：H1→H2→H3 从深紫到浅紫
    titleColor: '#5B3A7A',   // H1 深紫
    h2Color: '#7B5A9A',      // H2 中紫
    h3Color: '#9B7ABA',      // H3 浅紫

    // 正文与强调
    textColor: '#4A3F55',    // 正文 深灰紫
    accentColor: '#9B4DCA',  // 加粗 玫紫

    // 斜体 & 删除线
    emColor: '#B57BCA',      // 斜体 淡玫紫
    strikethroughColor: '#C8A8D8', // 删除线 极淡紫

    // 超链接
    linkColor: '#9B4DCA',    // 玫紫

    // 列表
    bulletColor: '#9B4DCA',  // 无序列表圆点 玫紫
    olNumberColor: '#5B3A7A',// 有序列表数字 深紫
    listNumberBg: '#5B3A7A',
    listNumberColor: '#FFFFFF',

    // 引用块
    blockquoteBorder: '#9B4DCA',  // 左侧竖线 玫紫
    blockquoteBg: '#F0E5F5',      // 引用块背景 淡紫
    blockquoteText: '#5B3A7A',

    // 代码块
    codeBg: '#EDE5F2',
    codeText: '#5B3A7A',

    // 头部 / 底部 / 分割线
    headerDateColor: '#5B3A7A',
    headerTextColor: '#9B7ABA',
    dividerColor: '#D4C4E0',

    // 高亮：淡紫黄
    markBg: '#F0E8F8',
  },
};

export default mushanzi;
