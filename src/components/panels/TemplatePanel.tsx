import React, { useState, useMemo } from 'react';
import { TEMPLATES, CATEGORY_LABELS, getCategoryCount, getTemplatesByCategory } from '@/data/templates';
import { useConfig } from '@/contexts/CardContext';
import { Check } from 'lucide-react';

const CATEGORIES = ['recommended', 'all'];

/**
 * 将 hex 颜色与 base hex 混合，amount 为前者权重（0–1）。
 * 避免使用 color-mix()（兼容性要求 Chrome 111+ / Safari 16.2+）。
 *
 * 防御性处理：若输入非标准 hex（如 rgb()、渐变、undefined），
 * parseInt 会返回 NaN，导致输出 "rgb(NaN,NaN,NaN)"（无效颜色，浏览器渲染为透明）。
 * 检测到 NaN 时降级返回 baseHex，确保缩略图边框始终可见。
 */
function mixHex(hex: string, baseHex: string, amount: number): string {
  const parse = (h: string) => {
    const s = h.replace('#', '');
    const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(baseHex);
  // 任一分量为 NaN（非 hex 颜色输入）时降级返回 baseHex
  if (isNaN(r1) || isNaN(g1) || isNaN(b1)) return baseHex;
  const r = Math.round(r1 * amount + r2 * (1 - amount));
  const g = Math.round(g1 * amount + g2 * (1 - amount));
  const b = Math.round(b1 * amount + b2 * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

// 模板图标样式缩略图
// React.memo：仅当 template / isActive / onClick 变化时重渲。
// 切换模板时只有「前一个激活项」和「新激活项」两个缩略图需要重渲，
// 其余缩略图（十几个）完全跳过，避免全量重渲。
const TemplateThumbnail: React.FC<{ template: (typeof TEMPLATES)[0]; isActive: boolean; onClick: () => void }> = React.memo(({ template, isActive, onClick }) => {
  const s = template.styles;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 focus:outline-none group"
    >
      {/* 外框图标容器 */}
      <div
        className="relative w-full transition-all duration-150"
        style={{
          aspectRatio: '5 / 6',
          borderRadius: '14px',
          background: isActive ? mixHex(s.accentColor, '#EBEBEB', 0.12) : '#EBEBEB',
          border: isActive ? `2px solid ${s.accentColor}` : '2px solid transparent',
          boxShadow: isActive
            ? `0 0 0 1px ${s.accentColor}55, 0 2px 6px rgba(0,0,0,0.10)`
            : '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14% 13%',
        }}
      >
        {/* 内部卡片色块 */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            background: s.cardBg,
            border: s.cardBorder ?? '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        />

        {/* 选中标识 */}
        {isActive && (
          <div
            className="absolute top-1.5 right-1.5 rounded-full w-4 h-4 flex items-center justify-center"
            style={{ background: s.accentColor }}
          >
            <Check size={10} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* 模板名 */}
      <div className="text-xs text-muted-foreground text-center truncate w-full leading-tight">
        {template.name}
      </div>
    </button>
  );
});

const TemplatePanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('recommended');
  const { config, setActiveTemplate } = useConfig();

  // useMemo：activeCategory 不变时跳过数组过滤，避免每次父级重渲都重建列表
  const templates = useMemo(
    () => getTemplatesByCategory(activeCategory),
    [activeCategory],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-sm font-medium text-foreground">选择模板</span>
      </div>

      {/* 分类 Tab */}
      <div className="px-3 py-2 border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 模板网格：3 列 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-3 gap-2.5">
          {templates.map((tpl) => (
            <TemplateThumbnail
              key={tpl.id}
              template={tpl}
              isActive={config.activeTemplateId === tpl.id}
              onClick={() => setActiveTemplate(tpl.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplatePanel;
