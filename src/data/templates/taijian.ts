import type { CardTemplate } from '@/types/card';

// 苔笺：奶黄虚线边框、深绿 H1 Banner、茶事东方风
const taijian: CardTemplate = {
  id: 'taijian',
  name: '苔笺',
  category: 'recommended',
  styles: {
    cardBg: '#FEFAEE',
    cardBorder: 'none',
    titleColor: '#2D5A3D',
    textColor: '#3D3020',
    accentColor: '#5B8A4A',
    listNumberBg: '#2D5A3D',
    listNumberColor: '#FFFFFF',
    bulletColor: '#3D3020',
    blockquoteBorder: '#C8A840',
    blockquoteBg: '#F5EFD8',
    blockquoteText: '#6B5020',
    codeBg: '#F5EFD8',
    codeText: '#3D3020',
    headerDateColor: '#2D5A3D',
    headerTextColor: '#888860',
    dividerColor: '#D4C27A',
    shadow: '0 2px 12px rgba(0,0,0,0.06)',
    titleBannerBg: '#2D5A3D',
    titleBannerTextColor: '#FFFFFF',
    h2Color: '#2D5A3D',
  },
};

export default taijian;
