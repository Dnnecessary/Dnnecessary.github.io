import type { CardTemplate } from '@/types/card';

// 深海蓝：极淡蓝灰底、深海蓝标题、青色点缀、沉稳专业风
// 适合技术文档、知识整理、专业报告
const shenhaiblue: CardTemplate = {
  id: 'shenhaiblue',
  name: '深海蓝',
  category: 'recommended',
  styles: {
    // 卡片基础
    cardBg: '#F0F4F8',
    cardBorder: 'none',
    shadow: '0 4px 20px rgba(26,58,92,0.08)',

    // 标题层次：H1→H2→H3 从深海蓝到浅海蓝
    titleColor: '#1A3A5C',   // H1 深海蓝
    h2Color: '#2E5A7C',      // H2 中海蓝
    h3Color: '#4A7A9C',      // H3 浅海蓝

    // 正文与强调
    textColor: '#2D4A6A',    // 正文 深蓝灰
    accentColor: '#2E7D9A',  // 加粗 海蓝

    // 斜体 & 删除线
    emColor: '#5A9AB8',      // 斜体 淡海蓝
    strikethroughColor: '#8AB8C8', // 删除线 极淡蓝

    // 超链接
    linkColor: '#2E7D9A',    // 海蓝

    // 列表
    bulletColor: '#2E7D9A',  // 无序列表圆点 海蓝
    olNumberColor: '#1A3A5C',// 有序列表数字 深海蓝
    listNumberBg: '#1A3A5C',
    listNumberColor: '#FFFFFF',

    // 引用块
    blockquoteBorder: '#2E7D9A',  // 左侧竖线 海蓝
    blockquoteBg: '#E0ECF5',      // 引用块背景 淡蓝
    blockquoteText: '#1A3A5C',

    // 代码块
    codeBg: '#E5EDF5',
    codeText: '#1A3A5C',

    // 头部 / 底部 / 分割线
    headerDateColor: '#1A3A5C',
    headerTextColor: '#4A7A9C',
    dividerColor: '#C8D8E8',

    // 高亮：淡蓝黄
    markBg: '#E8F0F8',
  },
};

export default shenhaiblue;
