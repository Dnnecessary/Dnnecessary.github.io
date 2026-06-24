// @refresh reset
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageCompressor';
import EditorToolbar from './EditorToolbar';
import SlashMenu, { SLASH_ITEMS, type SlashItem } from './SlashMenu';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  globalFont?: string;
  onEditorReady?: (editor: Editor) => void;
}

/**
 * 收集 ProseMirror 文档中所有 blob: 图片 src
 */
function collectBlobSrcs(doc: Editor['state']['doc']): Set<string> {
  const srcs = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === 'image' && typeof node.attrs.src === 'string' && node.attrs.src.startsWith('blob:')) {
      srcs.add(node.attrs.src);
    }
  });
  return srcs;
}

const RichEditor: React.FC<RichEditorProps> = ({ content, onChange, globalFont, onEditorReady }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [slashState, setSlashState] = useState({ visible: false, x: 0, y: 0, from: 0 });
  const [slashIndex, setSlashIndex] = useState(0);

  // 追踪所有由本组件创建的 blob: URL，用于生命周期管理
  const blobUrlsRef = useRef<Set<string>>(new Set());
  // 追踪上一次文档中存在的 blob srcs，用于 diff 检测删除
  const prevBlobSrcsRef = useRef<Set<string>>(new Set());
  // 持有最新 editor 实例，供 useEditor 配置对象内的异步回调使用
  const editorRef = useRef<Editor | null>(null);
  // onChange 防抖定时器：300ms 内连续击键只触发最后一次序列化，减少 getHTML 开销
  const onChangTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 持有最新 onChange prop，用于卸载 cleanup 中 flush 防抖时使用正确引用
  const onChangeRef = useRef<(html: string) => void>(onChange);
  // 同步最新 onChange 引用（每次渲染可能收到新 prop，但 setMarkdown 实际是稳定引用）
  onChangeRef.current = onChange;

  const closeSlash = useCallback(() => {
    setSlashState(s => ({ ...s, visible: false }));
    setSlashIndex(0);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: '输入内容，或输入 / 调起工具菜单…' }),
      TextStyle,
      FontFamily,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      // 300ms 防抖：连续击键时只在停顿后序列化 HTML，减少 getHTML() 开销
      if (onChangTimerRef.current) clearTimeout(onChangTimerRef.current);
      onChangTimerRef.current = setTimeout(() => {
        onChange(e.getHTML());
        onChangTimerRef.current = null;
      }, 300);

      // 检测斜杠命令触发
      const { from } = e.state.selection;
      const text = e.state.doc.textBetween(Math.max(0, from - 1), from);
      if (text === '/') {
        const coords = e.view.coordsAtPos(from - 1);
        setSlashState({ visible: true, x: coords.left, y: coords.bottom, from: from - 1 });
        setSlashIndex(0);
      } else if (slashState.visible) {
        closeSlash();
      }

      // ObjectURL 生命周期：diff 当前文档 blob srcs，revoke 已被删除的；注册新出现的
      const currentSrcs = collectBlobSrcs(e.state.doc);
      currentSrcs.forEach((src) => blobUrlsRef.current.add(src));
      prevBlobSrcsRef.current.forEach((src) => {
        if (!currentSrcs.has(src)) {
          URL.revokeObjectURL(src);
          blobUrlsRef.current.delete(src);
        }
      });
      prevBlobSrcsRef.current = currentSrcs;
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (!slashState.visible) return false;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSlashIndex(i => (i + 1) % SLASH_ITEMS.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSlashIndex(i => (i - 1 + SLASH_ITEMS.length) % SLASH_ITEMS.length);
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          execSlashItem(SLASH_ITEMS[slashIndex]);
          return true;
        }
        if (event.key === 'Escape') {
          closeSlash();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (!file) continue;
            compressImage(file).then((blob) => {
              const src = URL.createObjectURL(blob);
              editorRef.current?.chain().focus().setImage({ src }).run();
            });
            return true;
          }
        }
        return false;
      },
      transformPastedHTML: (html: string) => {
        return html.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '$1');
      },
    },
  });

  // 同步外部 content 变化（仅初始）
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const current = editor.getHTML();
      if (current !== content) editor.commands.setContent(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 通知父组件 editor 实例已就绪，同时同步 editorRef
  useEffect(() => {
    editorRef.current = editor;
    if (editor && onEditorReady) onEditorReady(editor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // 关闭斜杠菜单的全局点击
  useEffect(() => {
    const handler = () => { if (slashState.visible) closeSlash(); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [slashState.visible, closeSlash]);

  // 组件卸载时释放所有剩余 blob: URL，防止内存泄漏；同时清理防抖定时器
  useEffect(() => {
    return () => {
      if (onChangTimerRef.current) {
        clearTimeout(onChangTimerRef.current);
        onChangTimerRef.current = null;
        const latestHtml = editorRef.current?.getHTML();
        if (latestHtml != null) onChangeRef.current(latestHtml);
      }
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
      prevBlobSrcsRef.current.clear();
    };
  }, []);

  const execSlashItem = useCallback((item: SlashItem) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: slashState.from, to: from }).run();
    item.action(editor);
    closeSlash();
  }, [editor, slashState.from, closeSlash]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const blob = await compressImage(file);
    const src = URL.createObjectURL(blob);
    editor.chain().focus().setImage({ src }).run();
    toast.success('图片已插入');
    e.target.value = '';
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full" ref={editorContainerRef}>
      <EditorToolbar
        editor={editor}
        imageInputRef={imageInputRef}
        onImageUpload={handleImageUpload}
      />
      <div className="relative flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="rich-editor h-full"
          style={{ fontFamily: globalFont || undefined }}
        />
        <SlashMenu
          visible={slashState.visible}
          x={slashState.x}
          y={slashState.y}
          selectedIndex={slashIndex}
          onSelect={execSlashItem}
          onClose={closeSlash}
          editorRef={editorContainerRef}
        />
      </div>
    </div>
  );
};

export default RichEditor;
export type { RichEditorProps };
export type { Editor as TiptapEditor } from '@tiptap/react';
