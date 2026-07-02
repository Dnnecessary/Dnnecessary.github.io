import React, { useState } from 'react';
import { toCanvas } from 'html-to-image';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import type { ExportFormat, ExportQuality } from '@/types/card';
import { useConfig } from '@/contexts/CardContext';
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
  const { config } = useConfig();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('hd');
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const TIMEOUT_BY_SCALE: Record<number, number> = {
    2: 15_000,
    3: 25_000,
    4: 35_000,
    5: 50_000,
    6: 70_000,
  };

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let id: ReturnType<typeof setTimeout>;
    const race = Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        id = setTimeout(() => reject(new Error('导出超时')), ms);
      }),
    ]);
    race.finally(() => clearTimeout(id));
    return race;
  }

  /**
   * 导出过滤器：跳过不影响视觉的节点，防止 html-to-image 在这些节点上卡住。
   * - <script>：脚本不需要导出
   * - <link>：外部样式表可能导致 CORS fetch 挂起（样式已通过 <style> 内联）
   * - <meta>：元数据不需要导出
   */
  function exportFilter(node: HTMLElement): boolean {
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'LINK' || tag === 'META') return false;
    return true;
  }

  /**
   * 将 DOM 元素导出为 Blob
   * 关键配置：
   * - skipFonts: true：跳过字体嵌入（字体已通过 document.fonts.ready 加载，
   *   html-to-image 尝试 fetch 字体文件会挂起导致超时）
   * - skipAutoScale: true：跳过自动缩放
   * - filter: 跳过 script/link/meta 标签
   */
  async function exportElementToBlob(el: HTMLElement, scale: number, fmt: ExportFormat): Promise<Blob> {
    const exportOpts = {
      pixelRatio: scale,
      cacheBust: false,
      skipAutoScale: true,
      skipFonts: true,
      filter: exportFilter,
      backgroundColor: fmt === 'jpg' ? '#FFFFFF' : undefined,
    };

    try {
      const canvas = await withTimeout(
        toCanvas(el, exportOpts),
        TIMEOUT_BY_SCALE[scale] ?? 15_000
      );

      return new Promise<Blob>((resolve, reject) => {
        const mimeType = fmt === 'png' ? 'image/png' : 'image/jpeg';
        const quality = fmt === 'jpg' ? 0.92 : undefined;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas 转换为 Blob 失败'));
            }
          },
          mimeType,
          quality
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('超时')) {
        throw new Error(`导出超时（×${scale}），请降低清晰度后重试`);
      }
      throw new Error(`导出失败：${msg}`);
    }
  }

  /**
   * 预热策略：以 scale=1 先渲染一次，强制浏览器缓存图片资源
   */
  async function warmupExport(el: HTMLElement, fmt: ExportFormat): Promise<void> {
    const warmupOpts = {
      pixelRatio: 1,
      cacheBust: false,
      skipAutoScale: true,
      skipFonts: true,
      filter: exportFilter,
      backgroundColor: fmt === 'jpg' ? '#FFFFFF' : undefined,
    };
    try {
      await withTimeout(toCanvas(el, warmupOpts), 15_000);
    } catch {
      // 预热失败不阻塞正式导出，只是可能慢一些
      console.warn('预热阶段失败，继续尝试正式导出');
    }
  }

  /** 整页模式导出 */
  async function exportFullPage(el: HTMLElement, scale: number, fmt: ExportFormat) {
    const estimatedW = (el.offsetWidth || 440) * scale;
    const estimatedH = (el.offsetHeight || 600) * scale;
    const estimatedMB = (estimatedW * estimatedH * 4) / (1024 * 1024);
    if (estimatedMB > 25) {
      toast.warning(`当前清晰度（×${scale}）预计生成 ${Math.round(estimatedMB)} MB 图片，低配设备可能较慢`, { duration: 4000 });
    }
    // 超大图片直接拒绝，避免浏览器崩溃
    if (estimatedMB > 80) {
      toast.error(`当前清晰度（×${scale}）图片过大（约 ${Math.round(estimatedMB)} MB），可能导致浏览器崩溃，请降低清晰度`);
      return;
    }

    // 等待所有字体加载完成（包括 @font-face 和 FontFace）
    await document.fonts.ready;

    toast.info('正在准备资源…');
    // 预热：先以 scale=1 渲染，强制缓存字体和 CDN 资源
    await warmupExport(el, fmt);

    toast.info('开始导出…');
    const blob = await exportElementToBlob(el, scale, fmt);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `墨迹文卡_${Date.now()}.${fmt}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`导出成功！格式：${fmt.toUpperCase()}`);
  }

  /** 分页模式导出：逐页生成图片，单页直接下载，多页打包为 ZIP */
  async function exportPaged(container: HTMLElement, scale: number, fmt: ExportFormat) {
    const pages = Array.from(container.querySelectorAll('[data-page-card]')) as HTMLElement[];
    if (pages.length === 0) {
      toast.error('没有可导出的分页内容');
      return;
    }

    // 只有一页时直接导出为单张图片，不打包 ZIP
    if (pages.length === 1) {
      toast.info('正在准备资源…');
      try {
        await document.fonts.ready;
        // 预热：先以 scale=1 渲染，强制缓存字体和 CDN 资源
        await warmupExport(pages[0], fmt);
        toast.info('开始导出…');
        const blob = await exportElementToBlob(pages[0], scale, fmt);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `墨迹文卡_${Date.now()}.${fmt}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('导出成功！');
      } catch (err) {
        console.error('导出失败', err);
        const msg = err instanceof Error ? err.message : '未知错误';
        toast.error(msg, { duration: 6000 });
      }
      return;
    }

    toast.info('正在准备资源…');
    await document.fonts.ready;

    // 预热：只预热第一页，资源缓存后所有页都会受益
    await warmupExport(pages[0], fmt);

    toast.info(`开始导出 ${pages.length} 页，请稍候…`);

    const zip = new JSZip();
    const folder = zip.folder('墨迹文卡');
    let successCount = 0;
    let lastError = '';

    for (let i = 0; i < pages.length; i++) {
      try {
        const blob = await exportElementToBlob(pages[i], scale, fmt);
        folder?.file(`第${i + 1}页.${fmt}`, blob);
        successCount++;
        toast.info(`已导出 ${i + 1} / ${pages.length} 页`);
      } catch (err) {
        console.error(`第 ${i + 1} 页导出失败`, err);
        lastError = err instanceof Error ? err.message : String(err);
        toast.error(`第 ${i + 1} 页导出失败`);
      }
    }

    if (successCount === 0) {
      toast.error(lastError || '所有页面导出失败，请降低清晰度后重试', { duration: 6000 });
      return;
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `墨迹文卡_${Date.now()}.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${successCount} 页导出成功！`);
  }

  const handleExport = async () => {
    const el = previewRef.current;
    if (!el) {
      toast.error('找不到预览区域');
      return;
    }

    const scale = QUALITY_OPTIONS.find(q => q.value === quality)?.scale ?? 3;
    setIsExporting(true);

    try {
      if (config.pageMode === 'paged') {
        await exportPaged(el, scale, format);
      } else {
        await exportFullPage(el, scale, format);
      }
      setOpen(false);
    } catch (err) {
      console.error('导出失败', err);
      toast.error('导出失败，请重试');
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
