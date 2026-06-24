import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface HeadingPickerProps {
  editor: Editor;
}

const HeadingPicker: React.FC<HeadingPickerProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = editor.isActive('heading', { level: 1 })
    ? 'H1' : editor.isActive('heading', { level: 2 })
    ? 'H2' : editor.isActive('heading', { level: 3 })
    ? 'H3' : '¶';

  const items = [
    { label: 'H1', title: '标题1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'H2', title: '标题2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', title: '标题3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '¶', title: '段落', action: () => editor.chain().focus().setParagraph().run() },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        className="flex items-center gap-0.5 h-7 px-1.5 rounded text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        {current}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-8 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 w-24">
          {items.map(item => (
            <button
              key={item.label}
              onMouseDown={(e) => { e.preventDefault(); item.action(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent rounded transition-colors"
            >
              <span className="font-bold w-4 text-muted-foreground">{item.label}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeadingPicker;
