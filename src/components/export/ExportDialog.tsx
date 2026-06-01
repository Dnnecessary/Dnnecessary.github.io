import React, { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import type { ExportFormat, ExportQuality } from '@/types/card';
import { toast } from 'sonner';

interface ExportDialogProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

// 子组件定义在组件外部，避免每次 ExportDialog 渲染产生新类型导致 React 卸载重挂载
const OptionGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <div className="text-xs text-muted-foreground mb-2 font-medium">{label}</div>
    <div className="flex gap-2">{children}</div>
  </div>
);

interface OptionBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: string;
}

const OptionBtn: React.FC<OptionBtnProps> = ({ active, onClick, children, badge }) => (
  <button
    onClick={onClick}
    className={`relative flex-1 py-2 px-3 rounded-md text-sm border transition-all ${
      active
        ? 'border-primary bg-card text-foreground font-medium'
        : 'border-border text-muted-foreground hover:border-border/70 hover:text-foreground'
    }`}
  >
    {children}
    {badge && (
      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] px-1 rounded font-bold">
        {badge}
      </span>
    )}
  </button>
);

// qualityOptions 为纯常量，移至模块顶层：
// 避免每次 ExportDialog 渲染都重建数组 + 对象，减少 GC 压力。
const QUALITY_OPTIONS: { value: ExportQuality; label: string; scale: number; badge?: string }[] = [
  { value: 'hd',      label: '高清',   scale: 3 },
  { value: 'ultra',   label: '超清',   scale: 4 },
  { value: 'extreme', label: '极致',   scale: 5, badge: 'HOT' },
  { value: 'pro',     label: '专业',   scale: 6, badge: 'PRO' },
];

const ExportDialog: React.FC<ExportDialogProps> = ({ previewRef }) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('hd');
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    const el = previewRef.current;
    if (!el) {
      toast.error('找不到预览区域');
      return;
    }

    const scale = QUALITY_OPTIONS.find(q => q.value === quality)?.scale ?? 3;

    // 导出前估算内存占用：pixelRatio^2 × DOM 面积 × 4 字节/像素
    const estimatedW = (el.offsetWidth || 440) * scale;
    const estimatedH = (el.offsetHeight || 600) * scale;
    const estimatedMB = (estimatedW * estimatedH * 4) / (1024 * 1024);
    if (estimatedMB > 25) {
      toast.warning(
        `当前清晰度（×${scale}）预计生成 ${Math.round(estimatedMB)} MB 图片，低配设备可能较慢`,
        { duration: 4000 }
      );
    }

    setIsExporting(true);
    try {
      const opts = {
        pixelRatio: scale,
        cacheBust: true,
        skipAutoScale: false,
        backgroundColor: format === 'jpg' ? '#FFFFFF' : undefined,
      };

      // 15 秒超时保护：html-to-image 在跨域资源/字体未就绪/CSS filter 时会无限挂起
      const TIMEOUT_MS = 15_000;
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('导出超时')), TIMEOUT_MS);
      });

      let dataUrl: string;
      try {
        if (format === 'png') {
          dataUrl = await Promise.race([toPng(el, opts), timeout]);
        } else {
          dataUrl = await Promise.race([toJpeg(el, { ...opts, quality: 0.92 }), timeout]);
        }
      } finally {
        // 无论成功/失败，立即清理悬挂的超时定时器，避免 15s 后的无效 reject
        clearTimeout(timeoutId!);
      }

      const link = document.createElement('a');
      link.download = `墨迹文卡_${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`导出成功！格式：${format.toUpperCase()}，清晰度：${QUALITY_OPTIONS.find(q => q.value === quality)?.label ?? quality}`);
      setOpen(false);
    } catch (err) {
      console.error('导出失败', err);
      const isTimeout = err instanceof Error && err.message === '导出超时';
      toast.error(
        isTimeout
          ? '导出超时（15s），请尝试降低清晰度或减少图片数量'
          : '导出失败，请重试'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-stretch">
        <Button
          onClick={() => setOpen(true)}
          className="rounded-r-none pr-3 gap-1.5 font-medium"
          disabled={isExporting}
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          导出
        </Button>
        <PopoverTrigger asChild>
          <Button
            className="rounded-l-none pl-2 pr-2.5 border-l border-primary-foreground/30"
            disabled={isExporting}
          >
            <ChevronDown size={14} />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent align="end" className="w-72 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">导出设置</h3>
        </div>

        <OptionGroup label="导出格式">
          <OptionBtn active={format === 'png'} onClick={() => setFormat('png')}>PNG</OptionBtn>
          <OptionBtn active={format === 'jpg'} onClick={() => setFormat('jpg')}>JPG</OptionBtn>
        </OptionGroup>

        <OptionGroup label="清晰度">
          {QUALITY_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.value}
              active={quality === opt.value}
              onClick={() => setQuality(opt.value)}
              badge={opt.badge}
            >
              {opt.label}
            </OptionBtn>
          ))}
        </OptionGroup>

        <Button
          className="w-full mt-1 gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <><Loader2 size={14} className="animate-spin" />导出中...</>
          ) : (
            <><Download size={14} />开始导出</>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default ExportDialog;
