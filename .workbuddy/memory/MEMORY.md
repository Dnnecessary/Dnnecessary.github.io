# 墨迹文卡项目记忆

## 项目结构
- 入口：main.tsx → App.tsx → BrowserRouter + CardProvider → MainLayout（三栏布局）
- 状态管理：三拆分 Context（MarkdownCtx / ConfigCtx(27 setters) / FontCtx）
- 核心组件拆分：CardPreview.tsx(精简) + HighlightThemeLoader.ts + CardStyleEngine.tsx + WatermarkLayer.tsx + CardElements.tsx（CardHeader/CardFooter统一版）
- 模板系统：10套模板，TemplateCategory = 'recommended' | 'all'
- CSS class：卡片内容渲染统一使用 `.card-render`

## 技术偏好
- 用户注重视觉质量，偏好直接的CSS属性建议
- DEFAULT_MARKDOWN 已改为纯 Markdown 格式（非 HTML）
- 分页缓存为 LRU 4条
- 左侧面板宽度为响应式（w-72 → lg:w-[360px]）
- IntersectObserver/tailwindcss-intersect 已移除（未使用）
- RouteGuard/AuthContext 标注为 @deprecated 未启用

## 项目概况
- 墨迹文卡 (Miaoda React Admin) — Markdown/富文本 → 精美图片卡片工具
- 技术栈: React 18 + TypeScript + Vite(rolldown-vite) + TailwindCSS v3 + shadcn/ui + TipTap
- 核心流程: 左侧编辑 → 选择模板/自定义 → 右侧预览 → 导出 PNG/JPG

## 架构要点
- 三拆分 Context (Markdown/Config/Font) 避免全量重渲染
- 10 套内置模板，数据驱动扩展
- TipTap 富文本编辑器 + 300ms 防抖 + blob URL 内存管理
- DOMPurify XSS 防护 + CSS 颜色校验
- useDeferredValue 预览优化 + LRU(16) Markdown 渲染缓存

## 已知问题
- CardPreview.tsx 1043行，职责过重需拆分
- CardHeader/CardFooter 在两个文件重复定义，接口不一致
- configStore useMemo 依赖数组有重复项
- noop 函数类型不匹配
- 分页/整页模式 JSX 大量重复
- 面板 320px 硬编码，无响应式适配
