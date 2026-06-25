import type { CardTemplate } from '@/types/card';
import warmParchment from './warm-parchment';
import yuankong from './yuankong';
import taijian from './taijian';
import qingxuan from './qingxuan';
import zazhi from './zazhi';
import bohesuda from './bohesuda';
import piyingxi from './piyingxi';
import mushanzi from './mushanzi';
import shenhaiblue from './shenhaiblue';

// 所有模板按展示顺序汇总，新增模板只需 import 后加入此数组
export const TEMPLATES: CardTemplate[] = [
  warmParchment,
  yuankong,
  taijian,
  qingxuan,
  zazhi,
  bohesuda,
  piyingxi,
  mushanzi,
  shenhaiblue,
];

export const CATEGORY_LABELS: Record<string, string> = {
  recommended: '推荐',
  all: '全部',
};

export const getCategoryCount = (category: string): number => {
  if (category === 'all') return TEMPLATES.length;
  return TEMPLATES.filter(t => t.category === category).length;
};

export const getTemplatesByCategory = (category: string): CardTemplate[] => {
  if (category === 'all') return TEMPLATES;
  return TEMPLATES.filter(t => t.category === category);
};
