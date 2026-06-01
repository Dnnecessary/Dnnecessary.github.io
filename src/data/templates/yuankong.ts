import type { CardTemplate } from '@/types/card';

// 远空：极淡冷色渐变背景、极简商务、高留白
const yuankong: CardTemplate = {
  id: 'yuankong',
  name: '远空',
  category: 'recommended',
  styles: {
    cardBg: 'linear-gradient(to bottom, #E3F5FB 0%, #ffffff 25%)',
    titleColor: '#111111',
    textColor: '#333333',
    accentColor: '#111111',
    listNumberBg: '#111111',
    listNumberColor: '#FFFFFF',
    bulletColor: '#333333',
    blockquoteBorder: '#e0e0e0',
    blockquoteText: '#555555',
    codeBg: '#f4f4f4',
    codeText: '#222222',
    headerDateColor: '#111111',
    headerTextColor: '#888888',
    dividerColor: '#eeeeee',
    padding: '32px',
    borderRadius: '0px',
    shadow: 'none',
    blockquoteStyle: 'classic',
  },
};

export default yuankong;
