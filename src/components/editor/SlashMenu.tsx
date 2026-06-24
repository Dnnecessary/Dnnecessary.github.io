import React, { useRef, useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  List, ListOrdered, Quote, Minus, ImageIcon,
  Table, Code2,
} from 'lucide-react';
import { compressImage } from '@/utils/imageCompressor';

export interface SlashItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
  action: (editor: Editor) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    icon: <span className="text-xs font-bold text-muted-foreground w-5 text-center">H1</span>,
    label: '标题 1',
    desc: '大标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    icon: <span className="text-xs font-bold text-muted-foreground w-5 text-center">H2</span>,
    label: '标题 2',
    desc: '中标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: <span className="text-xs font-bold text-muted-foreground w-5 text-center">H3</span>,
    label: '标题 3',
    desc: '小标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    icon: <span className="text-xs text-muted-foreground w-5 text-center leading-none">¶</span>,
    label: '段落',
    desc: '普通文本',
    action: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    icon: <List size={14} className="text-muted-foreground" />,
    label: '无序列表',
    desc: '项目符号列表',
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    icon: <ListOrdered size={14} className="text-muted-foreground" />,
    label: '有序列表',
    desc: '编号列表',
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: <Quote size={14} className="text-muted-foreground" />,
    label: '引用',
    desc: '引用块',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    icon: <Minus size={14} className="text-muted-foreground" />,
    label: '分割线',
    desc: '水平分割线',
    action: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    icon: <ImageIcon size={14} className="text-muted-foreground" />,
    label: '图片',
    desc: '插入本地图片',
    action: (e) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const blob = await compressImage(file);
        const src = URL.createObjectURL(blob);
        e.chain().focus().setImage({ src }).run();
      };
      input.click();
    },
  },
  {
    icon: <Code2 size={14} className="text-muted-foreground" />,
    label: '代码块',
    desc: '多行代码',
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    icon: <Table size={14} className="text-muted-foreground" />,
    label: '表格',
    desc: '插入表格',
    action: (e) => {
      e.chain().focus().insertContent(
        '<table><thead><tr><th><p>列1</p></th><th><p>列2</p></th><th><p>列3</p></th></tr></thead><tbody><tr><td><p></p></td><td><p></p></td><td><p></p></td></tr></tbody></table>'
      ).run();
    },
  },
];

interface SlashMenuProps {
  visible: boolean;
  x: number;
  y: number;
  selectedIndex: number;
  onSelect: (item: SlashItem) => void;
  onClose: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

const SlashMenu: React.FC<SlashMenuProps> = ({ visible, x, y, selectedIndex, onSelect, editorRef }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible || !editorRef.current) return;
    const container = editorRef.current;
    const rect = container.getBoundingClientRect();
    const menuH = 320;
    const viewH = window.innerHeight;
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement | null;
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const top = y - rect.top + scrollTop + 8;
    const left = Math.min(x - rect.left, rect.width - 220);
    const finalTop = y + menuH > viewH - 16 ? top - menuH - 16 : top;
    setPos({ top: Math.max(finalTop, 4), left: Math.max(left, 0) });
  }, [visible, x, y, editorRef]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-popover border border-border rounded-xl shadow-lg py-1.5 w-52 overflow-hidden"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="px-3 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">块类型</div>
      {SLASH_ITEMS.map((item, i) => (
        <button
          key={item.label}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
            i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60 text-foreground'
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SlashMenu;
