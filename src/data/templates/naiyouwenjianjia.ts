import type { CardTemplate } from '@/types/card';

// 奶油文件夹：暖棕渐变页面背景、奶油色卡片、文件夹缺口、hero封面区
// 适合产品推荐、知识整理、图文笔记
const naiyouwenjianjia: CardTemplate = {
  id: 'naiyouwenjianjia',
  name: '奶油文件夹',
  category: 'recommended',
  styles: {
    // 外层页面背景
    pageBg: 'linear-gradient(180deg, #D9C6BA 0%, #CCB3A5 100%)',

    // 卡片基础
    cardBg: '#F7F4EE',
    cardBorder: 'none',
    shadow: '0 12px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',

    // 文件夹缺口
    folderStyle: true,

    // 左上装饰条
    decorationBar: '#DF5530',

    // 封面区 hero 背景
    heroBg: 'linear-gradient(135deg, #8D7461, #B59A84)',

    // 标题层次
    titleColor: '#FFFFFF',   // H1 在 hero 内用白色
    h2Color: '#D95B2B',      // H2 焦糖橙
    h3Color: '#D95B2B',      // H3 焦糖橙

    // 正文与强调
    textColor: '#453A34',    // 正文 深棕
    accentColor: '#D95B2B', // 加粗 焦糖橙

    // 次要文字
    secondaryColor: '#76695F',

    // 斜体 & 删除线
    emColor: '#A08060',
    strikethroughColor: '#C8B8A0',

    // 超链接
    linkColor: '#D95B2B',

    // 列表
    bulletColor: '#D95B2B',
    olNumberColor: '#8D7461',
    listNumberBg: '#8D7461',
    listNumberColor: '#FFFFFF',

    // 引用块
    blockquoteBorder: '#D4A574',
    blockquoteBg: '#F4ECDD',
    blockquoteText: '#5C3D2E',

    // 代码块
    codeBg: '#EDE5D8',
    codeText: '#453A34',

    // 头部 / 底部 / 分割线
    headerDateColor: '#453A34',
    headerTextColor: '#76695F',
    dividerColor: '#E5DDD3',

    // 信息卡片（tip）
    tipBg: '#F6EFE3',
    tipBorder: '#D95B2B',

    // 高亮
    markBg: '#F5E8D0',
  },
};

export default naiyouwenjianjia;
