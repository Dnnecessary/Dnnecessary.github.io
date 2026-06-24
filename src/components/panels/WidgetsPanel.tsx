import React, { useRef, useEffect } from 'react';
import { useConfig } from '@/contexts/CardContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { HEADER_STYLES, FOOTER_STYLES } from '@/types/card';
import type { WatermarkPosition } from '@/types/card';
import { RefreshCw, Upload, ImageOff } from 'lucide-react';
import { TEMPLATES } from '@/data/templates';

const SectionHeader: React.FC<{
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onChangeStyle: () => void;
}> = ({ title, enabled, onToggle, onChangeStyle }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-semibold text-foreground underline underline-offset-2">{title}</span>
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs gap-1 text-primary hover:text-primary"
        onClick={onChangeStyle}
      >
        <RefreshCw size={11} />
        更换样式
      </Button>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  </div>
);

// 迷你页头预览
const HeaderPreview: React.FC<{ styleId: string; date: string; text: string; text2?: string; avatarUrl?: string }> = ({ styleId, date, text, text2, avatarUrl }) => {
  const { config } = useConfig();
  const template = TEMPLATES.find(t => t.id === config.activeTemplateId) ?? TEMPLATES[0];
  const s = template.styles;

  const d = new Date(date);
  const day = isNaN(d.getTime()) ? '--' : String(d.getDate()).padStart(2, '0');
  const yearMonth = isNaN(d.getTime()) ? '' : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const chinese = isNaN(d.getTime()) ? '' : `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;

  const baseBg = typeof s.cardBg === 'string' && s.cardBg.startsWith('linear') ? '#F5F0E8' : s.cardBg;

  // style2：日期 + 文本
  if (styleId === 'style2') {
    return (
      <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '6px', borderBottom: `1px solid ${s.accentColor}40` }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: s.headerDateColor, lineHeight: 1 }}>{day}</div>
            <div style={{ fontSize: '8px', color: s.headerDateColor, opacity: 0.8 }}>{yearMonth}</div>
          </div>
          <div style={{ fontSize: '9px', color: s.headerTextColor }}>{text}</div>
        </div>
      </div>
    );
  }

  // style3：LOGO + 日期
  if (styleId === 'style3') {
    return (
      <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
        <div style={{ paddingBottom: '6px', borderBottom: `1px solid ${s.accentColor}40` }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: `${s.listNumberBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '7px', color: s.headerTextColor, opacity: 0.5 }}>头像</span>
            }
          </div>
          <div style={{ fontSize: '9px', color: s.headerDateColor, fontWeight: 500 }}>{chinese}</div>
        </div>
      </div>
    );
  }

  // style1（默认）：文本 + 文本
  return (
    <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: `1px solid ${s.accentColor}40` }}>
        <div style={{ fontSize: '9px', fontWeight: 600, color: s.headerDateColor }}>{text}</div>
        <div style={{ fontSize: '9px', color: s.headerTextColor, opacity: 0.8 }}>{text2 ?? ''}</div>
      </div>
    </div>
  );
};

// 迷你页脚预览
const FooterPreview: React.FC<{ styleId: string; text1: string; text2: string }> = ({ styleId, text1, text2 }) => {
  const { config } = useConfig();
  const template = TEMPLATES.find(t => t.id === config.activeTemplateId) ?? TEMPLATES[0];
  const s = template.styles;
  const baseBg = typeof s.cardBg === 'string' && s.cardBg.startsWith('linear') ? '#F5F0E8' : s.cardBg;

  const qrPlaceholder = (
    <div style={{ width: 32, height: 32, background: `${s.listNumberBg}30`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, background: `${s.listNumberBg}60`, borderRadius: 2 }} />
    </div>
  );

  if (styleId === 'style3') {
    return (
      <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
        <div style={{ paddingTop: '6px', borderTop: `1px solid ${s.accentColor}40`, textAlign: 'center' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: s.headerTextColor }}>{text1}</div>
          {text2 && <div style={{ fontSize: '8px', color: s.textColor, opacity: 0.6 }}>{text2}</div>}
        </div>
      </div>
    );
  }

  if (styleId === 'style2') {
    return (
      <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
        <div style={{ paddingTop: '6px', borderTop: `1px solid ${s.accentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          {qrPlaceholder}
          <div style={{ fontSize: '9px', fontWeight: 600, color: s.headerTextColor }}>{text1}</div>
          {text2 && <div style={{ fontSize: '8px', color: s.textColor, opacity: 0.6 }}>{text2}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3 border border-border" style={{ background: baseBg }}>
      <div style={{ paddingTop: '6px', borderTop: `1px solid ${s.accentColor}40`, display: 'flex', gap: '6px', alignItems: 'center' }}>
        {qrPlaceholder}
        <div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: s.headerTextColor }}>{text1}</div>
          {text2 && <div style={{ fontSize: '8px', color: s.textColor, opacity: 0.6, marginTop: '1px' }}>{text2}</div>}
        </div>
      </div>
    </div>
  );
};

const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: 'bottom-right', label: '右下角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'top-right', label: '右上角' },
  { value: 'center', label: '居中' },
  { value: 'tile', label: '平铺' },
];

const WidgetsPanel: React.FC = () => {
  const {
    config,
    setHeaderEnabled, setHeaderStyleId, setHeaderDate, setHeaderText, setHeaderText2, setHeaderAvatarUrl,
    setFooterEnabled, setFooterStyleId, setFooterQrcodeType, setFooterQrcodeValue, setFooterText1, setFooterText2,
    setWatermarkEnabled, setWatermarkImageUrl, setWatermarkOpacity, setWatermarkPosition, setWatermarkScale,
  } = useConfig();

  const { header, footer, watermark } = config;

  const headerStyles = ['style1', 'style2', 'style3'];
  const footerStyles = ['style1', 'style2', 'style3'];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // 持有最新的 blob: URL 引用，供卸载 cleanup 使用
  // cleanup 函数在 mount 时创建，若直接引用 watermark/header，闭包会捕获初始值（通常为空串）
  const latestWatermarkUrlRef = useRef(watermark.imageUrl);
  const latestAvatarUrlRef = useRef(header.avatarUrl ?? '');
  latestWatermarkUrlRef.current = watermark.imageUrl;
  latestAvatarUrlRef.current = header.avatarUrl ?? '';

  // 组件卸载时释放当前持有的 blob: URL，防止切换面板后内存无法回收
  // 通过 ref 读取最新 URL，避免闭包捕获 mount 时旧值的问题
  useEffect(() => {
    return () => {
      if (latestWatermarkUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(latestWatermarkUrlRef.current);
      if (latestAvatarUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(latestAvatarUrlRef.current);
    };
  }, []);

  const cycleHeaderStyle = () => {
    const idx = headerStyles.indexOf(header.styleId);
    setHeaderStyleId(headerStyles[(idx + 1) % headerStyles.length]);
  };

  const cycleFooterStyle = () => {
    const idx = footerStyles.indexOf(footer.styleId);
    setFooterStyleId(footerStyles[(idx + 1) % footerStyles.length]);
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 释放旧的 ObjectURL，防止内存泄漏
    if (watermark.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(watermark.imageUrl);
    setWatermarkImageUrl(URL.createObjectURL(file));
    setWatermarkEnabled(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 释放旧的 ObjectURL，防止内存泄漏
    if (header.avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(header.avatarUrl);
    setHeaderAvatarUrl(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-sm font-medium text-foreground">附加项</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* 页头设置 */}
        <div>
          <SectionHeader
            title="页头设置"
            enabled={header.enabled}
            onToggle={setHeaderEnabled}
            onChangeStyle={cycleHeaderStyle}
          />

          {header.enabled && (
            <div className="space-y-3">
              <HeaderPreview
                styleId={header.styleId}
                date={header.date}
                text={header.text}
                text2={header.text2}
                avatarUrl={header.avatarUrl}
              />

              {/* style1：文本 + 文本 */}
              {header.styleId === 'style1' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">文本1</Label>
                    <Input
                      value={header.text}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="如：墨迹文卡"
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">文本2</Label>
                    <Input
                      value={header.text2 ?? ''}
                      onChange={(e) => setHeaderText2(e.target.value)}
                      placeholder="如：极简易用的图文美化工具"
                      className="text-sm h-9"
                    />
                  </div>
                </>
              )}

              {/* style2：日期 + 文本 */}
              {header.styleId === 'style2' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">日期</Label>
                    <Input
                      type="date"
                      value={header.date}
                      onChange={(e) => setHeaderDate(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">文本</Label>
                    <Input
                      value={header.text}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="如：墨迹文卡"
                      className="text-sm h-9"
                    />
                  </div>
                </>
              )}

              {/* style3：LOGO + 日期 */}
              {header.styleId === 'style3' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">头像</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {header.avatarUrl ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img src={header.avatarUrl} alt="头像" className="w-12 h-12 rounded-full object-cover" />
                          <span className="text-xs text-muted-foreground">点击重新上传</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground py-1">
                          <Upload size={18} />
                          <span className="text-xs">点击上传头像</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">日期</Label>
                    <Input
                      type="date"
                      value={header.date}
                      onChange={(e) => setHeaderDate(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 分割线 */}
        <div className="border-t border-border" />

        {/* 页脚设置 */}
        <div>
          <SectionHeader
            title="页脚设置"
            enabled={footer.enabled}
            onToggle={setFooterEnabled}
            onChangeStyle={cycleFooterStyle}
          />

          {footer.enabled && (
            <div className="space-y-3">
              <FooterPreview styleId={footer.styleId} text1={footer.text1} text2={footer.text2} />

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">二维码类型</Label>
                <Select value={footer.qrcodeType} onValueChange={(v) => setFooterQrcodeType(v as 'link' | 'text')}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">链接生成</SelectItem>
                    <SelectItem value="text">文字生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {footer.qrcodeType === 'link' ? '链接地址' : '文字内容'}
                </Label>
                <Input
                  value={footer.qrcodeValue}
                  onChange={(e) => setFooterQrcodeValue(e.target.value)}
                  placeholder={footer.qrcodeType === 'link' ? 'https://...' : '输入文字内容'}
                  className="text-sm h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">文本1</Label>
                <Input
                  value={footer.text1}
                  onChange={(e) => setFooterText1(e.target.value)}
                  placeholder="品牌名称"
                  className="text-sm h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">文本2</Label>
                <Input
                  value={footer.text2}
                  onChange={(e) => setFooterText2(e.target.value)}
                  placeholder="描述文字"
                  className="text-sm h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* 分割线 */}
        <div className="border-t border-border" />

        {/* 水印设置 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground underline underline-offset-2">水印设置</span>
            <Switch checked={watermark.enabled} onCheckedChange={setWatermarkEnabled} />
          </div>

          <div className="space-y-3">
            {/* 上传区域 */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {watermark.imageUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={watermark.imageUrl} alt="水印预览" className="max-h-16 max-w-full object-contain" />
                  <span className="text-xs text-muted-foreground">点击重新上传</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload size={20} />
                  <span className="text-xs">点击上传水印图片</span>
                  <span className="text-xs opacity-60">支持 PNG / JPG / SVG</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleWatermarkUpload}
            />

            {watermark.imageUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground"
                onClick={() => {
                  // 清除前释放旧 ObjectURL，防止内存泄漏
                  if (watermark.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(watermark.imageUrl);
                  setWatermarkImageUrl('');
                  setWatermarkEnabled(false);
                }}
              >
                <ImageOff size={12} className="mr-1" />
                移除水印
              </Button>
            )}

            {/* 透明度 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">透明度</span>
                <span className="text-sm font-mono text-primary">{Math.round(watermark.opacity * 100)}%</span>
              </div>
              <Slider
                min={0.05}
                max={1}
                step={0.05}
                value={[watermark.opacity]}
                onValueChange={([v]) => setWatermarkOpacity(v)}
              />
            </div>

            {/* 缩放 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">大小</span>
                <span className="text-sm font-mono text-primary">{Math.round(watermark.scale * 100)}%</span>
              </div>
              <Slider
                min={0.1}
                max={1}
                step={0.05}
                value={[watermark.scale]}
                onValueChange={([v]) => setWatermarkScale(v)}
              />
            </div>

            {/* 位置 */}
            <div>
              <Label className="text-sm text-foreground block mb-2">位置</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {WATERMARK_POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setWatermarkPosition(pos.value)}
                    className={`py-1.5 px-2 rounded text-xs transition-all border ${
                      watermark.position === pos.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetsPanel;
