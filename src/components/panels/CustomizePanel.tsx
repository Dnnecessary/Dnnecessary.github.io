import React from 'react';
import { useConfig } from '@/contexts/CardContext';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Unlink2, FileText, Columns2 } from 'lucide-react';
import { CODE_THEMES } from '@/types/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-semibold text-foreground mb-3 mt-1">{children}</h3>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue?: string;
  onChange: (v: number) => void;
  linkedControl?: React.ReactNode;
}> = ({ label, value, min, max, step, displayValue, onChange, linkedControl }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {linkedControl}
        <span className="text-sm font-mono text-primary min-w-[36px] text-right">
          {displayValue ?? value.toFixed(1)}
        </span>
      </div>
    </div>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      className="w-full"
    />
  </div>
);

const CustomizePanel: React.FC = () => {
  const {
    config,
    setPageMode,
    setBaseFontSize,
    setLineHeight,
    setTitleLinked,
    setTitleFontSize,
    setTableLinked,
    setTableFontSize,
    setCodeTheme,
  } = useConfig();

  const { font } = config;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-sm font-medium text-foreground">自定义</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 卡片设置 */}
        <SectionLabel>卡片设置</SectionLabel>

        <div className="mb-4">
          <span className="text-sm text-foreground block mb-2">页面模式</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPageMode('full')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-sm transition-all ${
                config.pageMode === 'full'
                  ? 'bg-card border-primary text-foreground font-medium'
                  : 'border-border text-muted-foreground hover:border-border/80'
              }`}
            >
              <FileText size={14} />
              整页
            </button>
            <button
              onClick={() => setPageMode('paged')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-sm transition-all ${
                config.pageMode === 'paged'
                  ? 'bg-card border-primary text-foreground font-medium'
                  : 'border-border text-muted-foreground hover:border-border/80'
              }`}
            >
              <Columns2 size={14} />
              分页
            </button>
          </div>
        </div>

        {/* 字体样式 */}
        <SectionLabel>字体样式</SectionLabel>

        <SliderRow
          label="字体大小"
          value={font.baseFontSize}
          min={0.7}
          max={1.5}
          step={0.05}
          displayValue={font.baseFontSize.toFixed(1)}
          onChange={setBaseFontSize}
        />

        <SliderRow
          label="行高大小"
          value={font.lineHeight}
          min={1.2}
          max={2.4}
          step={0.1}
          displayValue={font.lineHeight.toFixed(1)}
          onChange={setLineHeight}
        />

        <SliderRow
          label="标题字号"
          value={font.titleLinked ? font.baseFontSize * font.titleFontSize : font.titleFontSize}
          min={0.8}
          max={2.5}
          step={0.05}
          displayValue={font.titleLinked ? '跟随正文' : (font.titleFontSize).toFixed(1)}
          onChange={(v) => {
            if (!font.titleLinked) setTitleFontSize(v);
          }}
          linkedControl={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTitleLinked(!font.titleLinked)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {font.titleLinked ? <Link2 size={13} /> : <Unlink2 size={13} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{font.titleLinked ? '点击独立设置' : '点击跟随正文'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        />

        <SliderRow
          label="表格字号"
          value={font.tableLinked ? font.baseFontSize * font.tableFontSize : font.tableFontSize}
          min={0.6}
          max={1.5}
          step={0.05}
          displayValue={font.tableLinked ? '跟随正文' : font.tableFontSize.toFixed(1)}
          onChange={(v) => {
            if (!font.tableLinked) setTableFontSize(v);
          }}
          linkedControl={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTableLinked(!font.tableLinked)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {font.tableLinked ? <Link2 size={13} /> : <Unlink2 size={13} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{font.tableLinked ? '点击独立设置' : '点击跟随正文'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        />

        {/* 代码主题 */}
        <SectionLabel>代码主题</SectionLabel>
        <div className="mb-4">
          <span className="text-sm text-foreground block mb-2">主题样式</span>
          <Select value={font.codeTheme} onValueChange={setCodeTheme}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择代码主题" />
            </SelectTrigger>
            <SelectContent>
              {CODE_THEMES.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CustomizePanel;
