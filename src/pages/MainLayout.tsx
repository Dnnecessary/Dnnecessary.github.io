import React, { useRef, useState } from 'react';
import EditorPanel from '@/components/panels/EditorPanel';
import TemplatePanel from '@/components/panels/TemplatePanel';
import CustomizePanel from '@/components/panels/CustomizePanel';
import WidgetsPanel from '@/components/panels/WidgetsPanel';
import CardPreview from '@/components/card/CardPreview';
import ExportDialog from '@/components/export/ExportDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import {
  PenLine, LayoutTemplate, Sliders, Layers, Bot,
  HelpCircle, User
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type NavTab = 'editor' | 'template' | 'customize' | 'widgets' | 'ai' | 'help' | 'user';

interface NavItem {
  id: NavTab;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const NAV_ITEMS_TOP: NavItem[] = [
  { id: 'editor', icon: <PenLine size={18} />, label: '编辑' },
  { id: 'template', icon: <LayoutTemplate size={18} />, label: '模板' },
  { id: 'customize', icon: <Sliders size={18} />, label: '自定义' },
  { id: 'widgets', icon: <Layers size={18} />, label: '小组件' },
  { id: 'ai', icon: <Bot size={18} />, label: 'AI助手', disabled: true },
];

const NAV_ITEMS_BOTTOM: NavItem[] = [
  { id: 'help', icon: <HelpCircle size={18} />, label: '帮助', disabled: true },
  { id: 'user', icon: <User size={18} />, label: '用户', disabled: true },
];

// NavButton 定义在组件外部，避免每次渲染产生新的组件类型
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onSelect: (id: NavTab) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onSelect }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => !item.disabled && onSelect(item.id)}
          disabled={item.disabled}
          className={`w-full flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg transition-all relative ${
            item.disabled
              ? 'opacity-40 cursor-not-allowed'
              : isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          {item.icon}
          <span className="text-[10px] leading-tight">{item.label}</span>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-foreground rounded-r-full opacity-60" />
          )}
        </button>
      </TooltipTrigger>
      {item.disabled && (
        <TooltipContent side="right">即将上线</TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('editor');
  const previewRef = useRef<HTMLDivElement>(null);

  const renderPanel = () => {
    switch (activeTab) {
      case 'editor': return <EditorPanel />;
      case 'template': return <TemplatePanel />;
      case 'customize': return <CustomizePanel />;
      case 'widgets': return <WidgetsPanel />;
      default: return <EditorPanel />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* 左侧导航栏 */}
      <aside className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-3 gap-1 z-20">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mb-3">
          <PenLine size={14} className="text-primary-foreground" />
        </div>

        {/* 上部导航 */}
        <div className="flex flex-col items-center gap-1 w-full px-1.5">
          {NAV_ITEMS_TOP.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onSelect={setActiveTab}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* 下部导航 */}
        <div className="flex flex-col items-center gap-1 w-full px-1.5">
          {NAV_ITEMS_BOTTOM.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onSelect={setActiveTab}
            />
          ))}
        </div>
      </aside>

      {/* 左侧内容面板 */}
      <div className="w-[320px] shrink-0 border-r border-border flex flex-col bg-card overflow-hidden">
        {/* 各面板独立错误边界：面板崩溃不影响预览区 */}
        <ErrorBoundary title="面板渲染出错" className="flex-1">
          {renderPanel()}
        </ErrorBoundary>
      </div>

      {/* 右侧主区域 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 顶部工具栏 */}
        <header className="h-12 shrink-0 flex items-center justify-end px-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <ExportDialog previewRef={previewRef} />
        </header>

        {/* 预览区独立错误边界：预览崩溃不影响编辑面板 */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/40 p-8 flex items-start justify-center">
          <div className="w-full flex justify-center">
            <ErrorBoundary title="预览渲染出错" className="w-full max-w-[440px] min-h-[300px]">
              <CardPreview previewRef={previewRef} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
