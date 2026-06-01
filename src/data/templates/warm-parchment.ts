import type { CardTemplate } from '@/types/card';

// 默认 - 暖纸：宣纸米黄、墨红标题、国风温暖
const warmParchment: CardTemplate = {
  id: 'warm-parchment',
  name: '默认',
  category: 'recommended',
  styles: {
    cardBg: '#F5F0E8',
    titleColor: '#8B3A2A',
    textColor: '#3D3020',
    accentColor: '#C85A3A',
    listNumberBg: '#2D5A3D',
    listNumberColor: '#FFFFFF',
    bulletColor: '#3D3020',
    blockquoteBorder: '#C85A3A',
    blockquoteText: '#6B5040',
    codeBg: '#EDE8D8',
    codeText: '#3D3020',
    headerDateColor: '#8B3A2A',
    headerTextColor: '#8B3A2A',
    dividerColor: '#C8B89A',
    padding: '28px',
    borderRadius: '12px',
    shadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
};

export default warmParchment;
