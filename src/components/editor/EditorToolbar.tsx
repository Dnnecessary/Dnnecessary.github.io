import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Quote, Minus, ImageIcon, Table, Code2,
} from 'lucide-react';
import ToolbarBtn from './ToolbarBtn';
import HeadingPicker from './HeadingPicker';
import HighlightPicker from './HighlightPicker';

interface EditorToolbarProps {
  editor: Editor;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, imageInputRef, onImageUpload }) => {
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border flex-wrap flex-shrink-0">
      <HeadingPicker editor={editor} />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗">
        <Bold size={13} />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体">
        <Italic size={13} />
      </ToolbarBtn>
      <HighlightPicker editor={editor} />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表">
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用">
        <Quote size={14} />
      </ToolbarBtn>
      <ToolbarBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线">
        <Minus size={14} />
      </ToolbarBtn>
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarBtn active={false} onClick={() => imageInputRef.current?.click()} title="插入图片">
        <ImageIcon size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={false}
        onClick={() => editor.chain().focus().insertContent(
          '<table><thead><tr><th><p>列1</p></th><th><p>列2</p></th></tr></thead><tbody><tr><td><p></p></td><td><p></p></td></tr></tbody></table>'
        ).run()}
        title="插入表格"
      >
        <Table size={14} />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="代码块">
        <Code2 size={14} />
      </ToolbarBtn>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageUpload}
      />
    </div>
  );
};

export default EditorToolbar;
