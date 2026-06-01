import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold, Italic,
  List, ListOrdered, Quote, Minus, ImageIcon,
  Table, Code2, ChevronDown, Highlighter,
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageCompressor';

// 斜杠菜单项定义
interface SlashItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
  action: (editor: Editor) => void;
}

const SLASH_ITEMS: SlashItem[] = [
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

// 斜杠菜单弹出层
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

  // 计算相对于编辑器容器的位置
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible || !editorRef.current) return;
    const container = editorRef.current;
    const rect = container.getBoundingClientRect();
    const menuH = 320;
    const viewH = window.innerHeight;
    // editorRef 指向 editorContainerRef（整个编辑器 flex 容器，非滚动容器）。
    // 实际可滚动的是其第二个子节点（overflow-y-auto div）。
    // absolute 定位的子元素 top 是相对于最近的 position!=static 祖先的 padding-box 顶部，
    // 不随祖先 scrollTop 移动；因此必须加上滚动容器的 scrollTop，
    // 才能将视口坐标转换为文档内坐标，保证菜单紧跟光标。
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement | null;
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const top = y - rect.top + scrollTop + 8;
    const left = Math.min(x - rect.left, rect.width - 220);
    // 防止超出底部（以视口为参考）
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

// 工具栏按钮
const ToolbarBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center justify-center w-7 h-7 rounded transition-colors text-sm flex-shrink-0 ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

// 标题选择下拉
const HeadingPicker: React.FC<{ editor: Editor }> = ({ editor }) => {
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

// 高亮颜色选择器
// ─── 预设 12 色 ────────────────────────────────────────────────────────────────
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

// 默认高亮颜色（会话级记忆，刷新后恢复）
const DEFAULT_HIGHLIGHT_COLOR = '#FFF176';

/**
 * 统计编辑器文档中当前高亮 mark 节点的数量。
 * 遍历 ProseMirror 文档树，检测含 highlight 属性的 mark。
 */
function countHighlights(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    node.marks.forEach((mark) => {
      if (mark.type.name === 'highlight') count++;
    });
  });
  return count;
}

const HIGHLIGHT_MAX = 100;

interface HighlightPickerProps {
  editor: Editor;
}

const HighlightPicker: React.FC<HighlightPickerProps> = ({ editor }) => {
  // 会话级：刷新后恢复默认色
  const [activeColor, setActiveColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /**
   * 应用高亮：
   * - 当前选区已有相同颜色高亮 → 移除（toggle）
   * - 当前选区已有不同颜色高亮 → 覆盖为新颜色
   * - 超出 100 处上限 → 提示用户，不应用
   */
  const applyHighlight = useCallback((color: string) => {
    if (!editor) return;
    // 如果选区为空，不操作
    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.info('请先选中文字，再应用高亮');
      return;
    }
    // 检查是否已有同色高亮（触发 toggle 移除）
    const isActive = editor.isActive('highlight', { color });
    if (!isActive) {
      // 非同色时检查上限
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

  // 当前是否处于高亮激活状态（用于工具栏按钮激活样式）
  const isHighlightActive = editor.isActive('highlight');

  return (
    <div className="relative flex items-center" ref={ref}>
      {/* 主按钮：直接应用上次颜色 */}
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
        {/* 颜色条：展示当前选中颜色 */}
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-sm"
          style={{ width: 14, height: 3, background: activeColor, display: 'block' }}
        />
      </button>

      {/* 箭头按钮：展开颜色面板 */}
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

      {/* 颜色面板 */}
      {open && (
        <div className="absolute top-9 left-0 z-50 bg-popover border border-border rounded-xl shadow-lg p-3 w-52">
          <div className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">高亮颜色</div>

          {/* 预设 12 色网格 */}
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

          {/* 分割线 */}
          <div className="border-t border-border mb-2.5" />

          {/* 自定义颜色 */}
          <div className="flex items-center gap-2">
            <button
              title="自定义颜色"
              onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {/* 渐变色块代表自定义 */}
              <span
                className="w-5 h-5 rounded-md border border-border flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)' }}
              />
              <span>自定义颜色…</span>
            </button>
            {/* 隐藏的原生颜色选择器 */}
            <input
              ref={colorInputRef}
              type="color"
              className="w-0 h-0 opacity-0 absolute"
              defaultValue={activeColor}
              onChange={(e) => {
                // onChange 实时预览色块（不立即应用）
                setActiveColor(e.target.value);
              }}
              onBlur={(e) => {
                // 用户关闭颜色选择器时才应用
                applyHighlight(e.target.value);
              }}
            />
          </div>

          {/* 移除高亮 */}
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

// 主编辑器组件
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
  // （handlePaste 等在 useEditor 初始化时构建，闭包捕获的 editor 为初始 null）
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
      // multicolor：允许每个 mark 存储独立的 color 属性，生成 <mark style="background-color:...">
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
        // 继续输入时关闭
        closeSlash();
      }

      // ObjectURL 生命周期：diff 当前文档 blob srcs，revoke 已被删除的；注册新出现的
      const currentSrcs = collectBlobSrcs(e.state.doc);
      // 新出现的 blob src（来自斜杠菜单/工具栏/粘贴）统一注册
      currentSrcs.forEach((src) => blobUrlsRef.current.add(src));
      // 从上次文档中消失的 blob src → revoke 并清除注册
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
      // 图片粘贴处理
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            event.preventDefault();
            const file = items[i].getAsFile();
            if (!file) continue;
            // 超过 1MB 时自动压缩为 WebP，再生成 ObjectURL
            // 使用 editorRef.current 而非闭包 editor，避免捕获初始 null
            compressImage(file).then((blob) => {
              const src = URL.createObjectURL(blob);
              editorRef.current?.chain().focus().setImage({ src }).run();
            });
            return true;
          }
        }
        return false;
      },
      // 粘贴 HTML 时剥离 <mark> 高亮标签，保留内部文字
      // 场景：用户从外部网页/文档复制带高亮的内容粘贴进来，不应保留源高亮颜色
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

  // 通知父组件 editor 实例已就绪，同时同步 editorRef（供 handlePaste 等异步回调使用）
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
      // flush 防抖：如果卸载时防抖 timer 还在（用户在 300ms 内切换 Tab），
      // 立即同步最新 HTML 到 Context，避免切回编辑器时内容被旧版本覆盖
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
    // 删除已输入的 "/"
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: slashState.from, to: from }).run();
    item.action(editor);
    closeSlash();
  }, [editor, slashState.from, closeSlash]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    // 超过 1MB 时自动压缩为 WebP，再生成 ObjectURL
    const blob = await compressImage(file);
    const src = URL.createObjectURL(blob);
    editor.chain().focus().setImage({ src }).run();
    toast.success('图片已插入');
    e.target.value = '';
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full" ref={editorContainerRef}>
      {/* 工具栏 */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border flex-wrap flex-shrink-0">
        <HeadingPicker editor={editor} />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗">
          <Bold size={13} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体">
          <Italic size={13} />
        </ToolbarBtn>
        {/* 高亮选色器：主按钮直接应用上次颜色，箭头展开 12 色 + 自定义 */}
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
          onChange={handleImageUpload}
        />
      </div>

      {/* 编辑区（相对定位，用于斜杠菜单定位） */}
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
export type { Editor as TiptapEditor };
