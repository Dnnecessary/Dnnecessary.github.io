import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 降级 UI 标题，默认"此区域发生错误" */
  title?: string;
  /** 是否显示完整错误信息（建议仅开发环境） */
  showDetail?: boolean;
  /** 降级 UI 的最小高度样式，用于嵌套在面板内 */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 通用错误边界：捕获子组件渲染错误，避免整页白屏。
 * 支持嵌套使用（编辑器 / 预览 / 面板各自独立边界）。
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获渲染错误:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { title = '此区域发生错误', showDetail = false, className = '' } = this.props;

    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[120px] ${className}`}
      >
        <AlertTriangle size={24} className="text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">组件渲染出现异常，可尝试刷新或重置</p>
          {showDetail && this.state.error && (
            <pre className="mt-2 text-left text-[10px] text-muted-foreground bg-muted rounded p-2 max-w-xs overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-7" onClick={this.handleReset}>
          <RotateCcw size={12} />
          重置
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
