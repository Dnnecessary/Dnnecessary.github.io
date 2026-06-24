import React, { useState } from 'react';
import { useMarkdown, useFontContext } from '@/contexts/CardContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FontPicker from '@/components/editor/FontPicker';
import RichEditor from '@/components/editor/RichEditor';
import type { TiptapEditor } from '@/components/editor/RichEditor';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// 示例内容（HTML格式）
const EXAMPLE_HTML = `<h1>示例文章标题</h1>
<p>这是一段<strong>加粗</strong>和<em>斜体</em>文字的示例。</p>
<h2>无序列表示例</h2>
<ul><li>第一项内容</li><li>第二项内容</li><li>第三项内容</li></ul>
<h2>有序列表示例</h2>
<ol><li>步骤一：准备材料</li><li>步骤二：开始操作</li><li>步骤三：完成检查</li></ol>
<blockquote><p>这是一段引用文字，用于展示引用样式效果。</p></blockquote>
<h2>代码示例</h2>
<pre><code class="language-python">def hello_world():
    print("Hello, World!")
    return True</code></pre>
<hr/>
<p><em>Made with 墨迹文卡</em></p>`;

const EditorPanel: React.FC = () => {
  const { markdown, setMarkdown } = useMarkdown();
  const { globalFont, setGlobalFont } = useFontContext();
  const [tiptapEditor, setTiptapEditor] = useState<TiptapEditor | null>(null);

  const handleExportHtml = () => {
    const blob = new Blob([markdown], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '墨迹文卡内容.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('内容已导出');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-medium text-foreground">填写内容</span>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportHtml} title="导出HTML">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>导出内容</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary gap-1"
            onClick={() => setMarkdown(EXAMPLE_HTML)}
          >
            <Sparkles size={12} />
            添加示例
          </Button>
          {/* 字体选择器（有选区时局部应用，否则全局切换） */}
          <FontPicker
            globalFont={globalFont}
            onGlobalFontChange={setGlobalFont}
            editor={tiptapEditor}
          />
        </div>
      </div>

      {/* 富文本编辑器（含工具栏） */}
      <div className="flex-1 overflow-hidden bg-card">
        <RichEditor
          content={markdown}
          onChange={setMarkdown}
          globalFont={globalFont}
          onEditorReady={setTiptapEditor}
        />
      </div>
    </div>
  );
};

export default EditorPanel;

