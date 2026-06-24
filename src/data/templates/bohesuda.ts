import type { CardTemplate } from '@/types/card';

// 薄荷苏打：薄荷白底、森林绿到淡薄荷的渐变层次
// 呼吸感强，适合自律打卡、学习干货
const bohesuda: CardTemplate = {
  id: 'bohesuda',
  name: '薄荷苏打',
  category: 'recommended',
  styles: {
    // 卡片基础
    cardBg: '#F0F9F6',
    cardBorder: 'none',
    shadow: '0 4px 20px rgba(45,106,79,0.08)',

    // 标题层次：H1→H2→H3 从深到浅
    titleColor: '#2D6A4F',   // H1 森林绿
    h2Color: '#40916C',      // H2 薄荷绿
    h3Color: '#52B788',      // H3 浅绿

    // 正文与强调
    textColor: '#1B4332',    // 正文 深绿灰
    accentColor: '#2D6A4F',  // 加粗 森林绿

    // 斜体 & 删除线
    emColor: '#95D5B2',      // 斜体 淡薄荷
    strikethroughColor: '#B7E4C7', // 删除线 极淡绿

    // 超链接
    linkColor: '#40916C',    // 薄荷绿

    // 列表
    bulletColor: '#40916C',  // 无序列表圆点 薄荷绿
    olNumberColor: '#2D6A4F',// 有序列表数字 森林绿
    listNumberBg: '#2D6A4F', // 表格表头辅助底色基准
    listNumberColor: '#FFFFFF',

    // 引用块
    blockquoteBorder: '#2D6A4F',  // 左侧竖线 森林绿
    blockquoteBg: '#F5FBF8',      // 引用块背景 极淡薄荷
    blockquoteText: '#2D6A4F',

    // 代码块
    codeBg: '#E8F5E9',
    codeText: '#1B4332',

    // 头部 / 底部 / 分割线
    headerDateColor: '#2D6A4F',
    headerTextColor: '#52B788',
    dividerColor: '#D8F3DC',
  },
};

export default bohesuda;
