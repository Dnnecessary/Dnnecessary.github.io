import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Highlighter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { Editor } from '@tiptap/react';

const HIGHLIGHT_PRESET_COLORS: { color: string; label: string }[] = [
  { color: '#FFF176', label: '柠檬黄' },
  { color: '#FFEB3B', label: '明黄' },
  { color: '#C8E6C9', label: '薄荷绿' },
  { color: '#A5D6A7', label: '嫩绿' },
  { color: '#B3E5FC', label: '天蓝' },
  { color: '#90CAF9', label: '浅蓝' },
  { color: '#FFCDD2', label: '樱花粉' },
  { color: '#EF9A9A', label: '浅红' },
  { color: '#FFE0B2', label: '暖橙' },
  { color: '#FFCC80', label: '橙黄' },
  { color: '#E1BEE7', label: '淡紫' },
  { color: '#CE93D8', label: '薰衣草' },
];

const DEFAULT_HIGHLIGHT_COLOR = '#FFF176';
const HIGHLIGHT_MAX = 100;

function countHighlights(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    node.marks.forEach((mark) => {
      if (mark.type.name === 'highlight') count++;
    });
  });
  return count;
}

interface HighlightPickerProps {
  editor: Editor;
}

const HighlightPicker: React.FC<HighlightPickerProps> = ({ editor }) => {
  const [activeColor, setActiveColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyHighlight = useCallback((color: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.info('请先选中文字，再应用高亮');
      return;
    }
    const isActive = editor.isActive('highlight', { color });
    if (!isActive) {
      const current = countHighlights(editor);
      if (current >= HIGHLIGHT_MAX) {
        toast.warning(`高亮数量已达上限（${HIGHLIGHT_MAX} 处），请先清除部分高亮后再添加`);
        return;
      }
    }
    editor.chain().focus().toggleHighlight({ color }).run();
    setActiveColor(color);
    setOpen(false);
  }, [editor]);

  const isHighlightActive = editor.isActive('highlight');

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        title={`高亮（${HIGHLIGHT_PRESET_COLORS.find(c => c.color === activeColor)?.label ?? '自定义'}）`}
        onMouseDown={(e) => { e.preventDefault(); applyHighlight(activeColor); }}
        className={`flex items-center justify-center w-7 h-7 rounded-l transition-colors text-sm flex-shrink-0 relative ${
          isHighlightActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        <Highlighter size={13} />
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-sm"
          style={{ width: 14, height: 3, background: activeColor, display: 'block' }}
        />
      </button>

      <button
        title="选择高亮颜色"
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        className={`flex items-center justify-center w-4 h-7 rounded-r transition-colors flex-shrink-0 border-l border-border/40 ${
          open
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-50 bg-popover border border-border rounded-xl shadow-lg p-3 w-52">
          <div className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">高亮颜色</div>

          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {HIGHLIGHT_PRESET_COLORS.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onMouseDown={(e) => { e.preventDefault(); applyHighlight(color); }}
                className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                style={{
                  background: color,
                  borderColor: activeColor === color ? '#333' : 'transparent',
                  outline: activeColor === color ? `2px solid ${color}88` : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>

          <div className="border-t border-border mb-2.5" />

          <div className="flex items-center gap-2">
            <button
              title="自定义颜色"
              onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <span
                className="w-5 h-5 rounded-md border border-border flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)' }}
              />
              <span>自定义颜色…</span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="w-0 h-0 opacity-0 absolute"
              defaultValue={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              onBlur={(e) => applyHighlight(e.target.value)}
            />
          </div>

          <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().unsetHighlight().run();
              setOpen(false);
            }}
            className="mt-1.5 w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <span className="w-5 h-5 rounded-md border border-dashed border-border flex-shrink-0 flex items-center justify-center text-[10px]">✕</span>
            <span>移除高亮</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HighlightPicker;
