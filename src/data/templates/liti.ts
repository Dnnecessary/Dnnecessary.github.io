import type { CardTemplate } from '@/types/card';

// 立体：暖棕底、macOS 风格顶栏、深棕 H1 Banner、橙色 H2
const liti: CardTemplate = {
  id: 'liti',
  name: '立体',
  category: 'recommended',
  styles: {
    cardBg: '#F2E8DC',
    titleColor: '#4A2E1A',
    textColor: '#3D2B1A',
    accentColor: '#C4602A',
    listNumberBg: '#C4602A',
    listNumberColor: '#FFFFFF',
    bulletColor: '#3D2B1A',
    blockquoteBorder: '#C4602A',
    blockquoteText: '#5C3D2E',
    codeBg: '#E8DDD0',
    codeText: '#3D2B1A',
    headerDateColor: '#3D2B1A',
    headerTextColor: '#8B6B52',
    dividerColor: '#C4B49A',
    padding: '24px',
    borderRadius: '12px',
    shadow: '0 4px 16px rgba(0,0,0,0.12)',
    titleBannerBg: '#5C3D2E',
    titleBannerTextColor: '#F5EFE6',
    h2Color: '#C4602A',
    topBarBg: '#8B6B52',
  },
};

export default liti;
