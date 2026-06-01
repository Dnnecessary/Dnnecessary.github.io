// 字体选择器下拉组件
// - 有选中文字：对选区应用 setFontFamily（局部字体）
// - 无选中文字：切换全文字体（全局模式）
// - 自定义字体悬浮显示删除按钮
import React, { useState } from 'react';
import { Type, Upload, X, Check, ChevronDown } from 'lucide-react';
import { useFontManager, type FontItem } from '@/hooks/useFontManager';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { Editor } from '@tiptap/react';

interface FontPickerProps {
  // 当前全局字体 family
  globalFont: string;
  onGlobalFontChange: (family: string) => void;
  // TipTap editor 实例，用于判断是否有选区
  editor?: Editor | null;
}

const FontPicker: React.FC<FontPickerProps> = ({
  globalFont,
  onGlobalFontChange,
  editor,
}) => {
  const { allFonts, uploadFont, deleteFont } = useFontManager();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 当前激活字体名称（用于按钮显示）
  const activeFont = allFonts.find(f => f.family === globalFont);

  const handleSelect = (font: FontItem) => {
    // 判断编辑器是否有文字选区
    const hasSelection =
      editor &&
      !editor.state.selection.empty;

    if (hasSelection && editor) {
      // 局部模式：对选区应用字体
      editor.chain().focus().setFontFamily(font.family).run();
      toast.success(`已对选中文字应用「${font.name}」`);
    } else {
      // 全局模式：切换全文字体
      onGlobalFontChange(font.family);
      toast.success(`全文字体已切换为「${font.name}」`);
    }
    setOpen(false);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const font = await uploadFont();
      if (font) {
        toast.success(`字体「${font.name}」上传成功`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    deleteFont(id);
    toast.success(`已删除字体「${name}」`);
  };

  const builtinFonts = allFonts.filter(f => f.isBuiltin);
  const customFonts = allFonts.filter(f => !f.isBuiltin);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-0.5 h-7 px-1.5 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs"
          title="字体"
        >
          <Type size={14} />
          <span className="max-w-[52px] truncate hidden sm:block">
            {activeFont ? activeFont.name : '字体'}
          </span>
          <ChevronDown size={10} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-1.5" side="bottom">
        {/* 内置字体 */}
        <div className="text-[10px] text-muted-foreground px-2 py-1 font-medium">内置字体</div>
        {builtinFonts.map(font => (
          <FontRow
            key={font.id}
            font={font}
            isActive={globalFont === font.family}
            hovered={hoveredId === font.id}
            onHover={setHoveredId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}

        {/* 自定义字体 */}
        {customFonts.length > 0 && (
          <>
            <Separator className="my-1" />
            <div className="text-[10px] text-muted-foreground px-2 py-1 font-medium">自定义字体</div>
            {customFonts.map(font => (
              <FontRow
                key={font.id}
                font={font}
                isActive={globalFont === font.family}
                hovered={hoveredId === font.id}
                onHover={setHoveredId}
                onSelect={handleSelect}
                onDelete={handleDelete}
                showDelete
              />
            ))}
          </>
        )}

        {/* 上传按钮 */}
        <Separator className="my-1" />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Upload size={12} />
          {uploading ? '上传中...' : '上传字体文件'}
          <span className="ml-auto text-[10px] opacity-60">ttf/otf/woff</span>
        </button>
      </PopoverContent>
    </Popover>
  );
};

// ────────────────────────────────────────────────
// 单行字体项
// ────────────────────────────────────────────────
interface FontRowProps {
  font: FontItem;
  isActive: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (font: FontItem) => void;
  onDelete?: (e: React.MouseEvent, id: string, name: string) => void;
  showDelete?: boolean;
}

const FontRow: React.FC<FontRowProps> = ({
  font, isActive, hovered, onHover, onSelect, onDelete, showDelete = false,
}) => (
  <div
    className="relative flex items-center"
    onMouseEnter={() => onHover(font.id)}
    onMouseLeave={() => onHover(null)}
  >
    <button
      onClick={() => onSelect(font)}
      className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left ${
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'text-foreground hover:bg-accent'
      }`}
      style={{ fontFamily: font.family }}
    >
      {isActive && <Check size={11} className="text-primary shrink-0" />}
      {!isActive && <span className="w-[11px] shrink-0" />}
      <span className="truncate">{font.name}</span>
    </button>

    {/* 悬浮删除按钮（仅自定义字体） */}
    {showDelete && onDelete && hovered && (
      <button
        onClick={(e) => onDelete(e, font.id, font.name)}
        className="absolute right-1 flex items-center justify-center w-5 h-5 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
        title="删除字体"
      >
        <X size={10} />
      </button>
    )}
  </div>
);

export default FontPicker;
