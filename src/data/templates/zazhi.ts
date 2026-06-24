import type { CardTemplate } from '@/types/card';

// 杂志：纯白纸感、陶土红强调、实心方块列表、标题装饰短横线
const zazhi: CardTemplate = {
  id: 'zazhi',
  name: '杂志',
  category: 'recommended',
  styles: {
    cardBg: '#FAFAF8',
    cardBorder: 'none',
    titleColor: '#2C3E50',
    textColor: '#2C3E50',
    accentColor: '#8B4513',
    listNumberBg: '#2C3E50',
    listNumberColor: '#FFFFFF',
    bulletColor: '#2C3E50',
    blockquoteBorder: '#2C3E50',
    blockquoteText: '#555555',
    codeBg: '#F4F4F4',
    codeText: '#2C3E50',
    headerDateColor: '#2C3E50',
    headerTextColor: '#888888',
    dividerColor: '#E0E0E0',
    shadow: '0 2px 16px rgba(0,0,0,0.06)',
    titleDecorationBar: true,
    bulletShape: 'square',
  },
};

export default zazhi;
