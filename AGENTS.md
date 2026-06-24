# AGENTS.md — 墨迹文卡（Miaoda React Admin）

> 本文件面向 AI 编程助手。以下所有信息均基于项目实际文件内容，不含推测。

---

## 1. 项目概述

- **应用名称**：墨迹文卡
- **项目标识**：`miaoda-react-admin`（`package.json` 中的 `name`）
- **应用描述**：一款专注于内容排版的轻量级网页工具，帮助用户将纯文本 / Markdown 快速转化为高颜值的长图卡片。核心流程：左侧富文本编辑 → 选择模板 / 自定义样式 → 右侧实时预览 → 导出 PNG/JPG。
- **入口**：`index.html` → `src/main.tsx` → `src/App.tsx` → `src/pages/MainLayout.tsx`
- **路由**：单页应用，仅配置了一条路由 `/`（`src/routes.tsx`），`public: true`，无需登录即可访问。

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 构建工具 | Vite（实际使用 `rolldown-vite`，即 Rust 版 Vite） |
| 前端框架 | React 18 + TypeScript ~5.9.3 |
| 样式方案 | Tailwind CSS v3 + PostCSS + Autoprefixer |
| UI 组件库 | shadcn/ui（style: new-york，基于 Radix UI  primitives） |
| 图标 | Lucide React |
| 富文本编辑器 | TipTap（`@tiptap/react` + `starter-kit` + `extension-image` + `extension-placeholder` + `extension-text-style` + `extension-font-family` + `extension-highlight`） |
| Markdown 渲染 | `markdown-it` + `highlight.js` |
| 图片导出 | `html-to-image`（`toPng` / `toJpeg`） |
| 二维码生成 | `qrcode` |
| 状态管理 | 自定义 React Context（未使用 Redux / Zustand） |
| 通知 | `sonner`（toast） |
| 后端 / 数据库 | Supabase（`@supabase/supabase-js`），但实际 `src/db/` 目录**不存在**于代码包中 |
| 平台插件 | `miaoda-sc-plugin`（内部/平台专用插件，提供 dev server 扩展、Sentry 监控、HMR 控制等） |

---

## 3. 项目结构

```
├── public/                     # 静态资源（favicon、图片）
├── src/
│   ├── App.tsx                 # 根组件：Router + CardProvider + ErrorBoundary + Routes
│   ├── main.tsx                # React DOM 挂载入口
│   ├── routes.tsx              # 路由表定义（当前仅一条 / 路由）
│   ├── index.css               # 全局样式（Tailwind directives + CSS 变量 + TipTap 编辑器样式）
│   ├── global.d.ts             # 全局类型声明（百度地图 GL）
│   ├── vite-env.d.ts           # Vite 客户端类型
│   ├── svg.d.ts                # SVG 导入类型
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件（Button、Dialog、Select、Slider 等 40+ 个）
│   │   ├── panels/             # 左侧四大面板：EditorPanel、TemplatePanel、CustomizePanel、WidgetsPanel
│   │   ├── card/               # CardPreview（右侧卡片实时预览）
│   │   ├── export/             # ExportDialog（右上角导出弹窗）
│   │   ├── editor/             # RichEditor（TipTap 封装）、FontPicker（字体选择器）
│   │   └── common/             # ErrorBoundary、IntersectObserver、PageMeta、RouteGuard
│   ├── contexts/
│   │   ├── CardContext.tsx     # 核心状态管理（拆分为 3 个独立 Context）
│   │   └── AuthContext.tsx     # Supabase 认证上下文（但 src/db/supabase.ts 文件缺失）
│   ├── data/
│   │   ├── templates.ts        # 模板导出兼容层
│   │   └── templates/          # 各模板定义：warm-parchment、yuankong、taijian、qingxuan、liti、zazhi、bohesuda
│   ├── hooks/
│   │   ├── useFontManager.ts   # 字体管理（内置字体 + 自定义字体上传，IndexedDB 存储 base64）
│   │   ├── use-supabase-upload.ts  # Supabase 文件上传 Hook
│   │   ├── use-mobile.tsx
│   │   └── use-go-back.ts
│   ├── lib/
│   │   ├── utils.ts            # cn()（clsx + tailwind-merge）、queryString、formatDate
│   │   └── markdownRenderer.ts # MarkdownIt 实例 + 模板 CSS 变量生成 + 16 条 LRU 渲染缓存
│   ├── pages/
│   │   ├── MainLayout.tsx      # 主界面三栏布局（左侧导航 + 左侧面板 + 右侧预览/导出）
│   │   ├── SamplePage.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   └── .keep               # 空目录占位
│   ├── types/
│   │   ├── card.ts             # 核心类型：CardConfig、CardTemplate、TemplateStyles、PageMode、WatermarkPosition 等
│   │   └── index.ts            # Option 类型
│   └── utils/
│       └── imageCompressor.ts  # Canvas 图片压缩（>1MB 自动转 WebP，限制 1920px，质量 0.85）
├── .rules/                     # ast-grep 自定义扫描规则 + 检查脚本
├── docs/
│   └── prd.md                  # 产品需求文档（中文，详细描述功能与验收标准）
├── package.json
├── vite.config.ts              # 生产构建配置
├── vite.config.dev.ts          # 开发服务器配置（含 HMR 开关 API、Sentry、injected.js）
├── tsconfig.json               # TypeScript 项目引用配置（references tsconfig.app.json / tsconfig.node.json）
├── tsconfig.app.json           # 应用端 TS 配置（strict、noUnusedLocals、noUnusedParameters、isolatedModules）
├── tsconfig.check.json         # 类型检查专用配置（排除 src/components/ui）
├── tsconfig.node.json          # Node 端 TS 配置
├── tailwind.config.js          # Tailwind 配置（含自定义颜色、动画、插件）
├── postcss.config.js           # PostCSS 配置（tailwindcss + autoprefixer）
├── components.json             # shadcn/ui 配置
├── biome.json                  # Biome linter 配置
├── sgconfig.yml                # ast-grep 配置（规则目录 .rules，语言映射）
└── pnpm-workspace.yaml         # pnpm workspace（几乎为空，仅 catalog 依赖）
```

---

## 4. 构建与检查命令

```bash
# 安装依赖
pnpm install   # 或 npm install

# ⚠️ 注意：package.json 中的 dev / build 脚本被显式禁用
# "dev": "echo 'Do not use this command, only use lint to check'"
# "build": "echo 'Do not use this command, only use lint to check'"

# 唯一可用的验证命令
pnpm run lint
```

`pnpm run lint` 实际执行的串联检查（见 `package.json`）：

1. `tsgo -p tsconfig.check.json` —— TypeScript 类型检查（使用 `tsgo`，Go 实现的 TS 编译器）。
2. `npx biome lint` —— Biome linter 检查（配置见 `biome.json`）。
3. `.rules/check.sh` —— 自定义 ast-grep 规则扫描（见下方「自定义规则」）。
4. `npx tailwindcss -i ./src/index.css -o /dev/null ...` —— Tailwind CSS 语法检查。
5. `.rules/testBuild.sh` —— 测试构建（`vite build --minify false` 到临时目录）。

> 项目**没有单元测试**（未发现 `.test.ts` / `.spec.ts` 文件，且 `tsconfig.check.json` 明确排除测试文件）。

---

## 5. 代码风格与规范

### 5.1 Biome 配置（`biome.json`）
- **格式化**：`enabled: false`（不使用 Biome 格式化）。
- **Lint 范围**：`src/**/*.{js,jsx,ts,tsx,css,scss}` + `tailwind.config.js`。
- **启用规则**：
  - `correctness.noUndeclaredDependencies: error`
  - `suspicious.noRedeclare: error`
  - `style.noCommonJs: error`（`tailwind.config.js` 除外）
- **VCS**：启用 git，读取 `.gitignore`。

### 5.2 TypeScript 严格配置（`tsconfig.app.json`）
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`
- `isolatedModules: true`
- `moduleDetection: force`
- `jsx: "react-jsx"`
- Path alias: `@/*` → `./src/*`

### 5.3 命名与组织约定（从代码中观察）
- 组件使用 `React.FC<Props>` 显式声明（函数组件）。
- 自定义 Hook 以 `use` 开头（如 `useFontManager`）。
- Context 文件同时导出 `Provider` 和 `useXxx` Hook。
- 工具函数放在 `src/lib/` 或 `src/utils/`；`src/lib/` 偏通用（`cn`、`formatDate`），`src/utils/` 偏业务（`imageCompressor`）。
- 模板数据放在 `src/data/templates/` 下，每个模板一个独立 `.ts` 文件，统一在 `src/data/templates/index.ts` 汇总导出。
- 大量中文注释，且注释非常详细（包含性能优化背景、边界情况处理、设计决策说明）。

---

## 6. 核心架构细节

### 6.1 状态管理：拆分 Context（`src/contexts/CardContext.tsx`）
为避免「上帝 Context」导致的全量重渲染，状态被拆分为 **3 个独立 Context**：

| Context | 内容 | 消费者 |
|---------|------|--------|
| `MarkdownContext` | `markdown` / `setMarkdown` | EditorPanel、CardPreview |
| `ConfigContext` | `CardConfig` + 所有 setter | CustomizePanel、TemplatePanel、WidgetsPanel、CardPreview |
| `FontContext` | `globalFont` / `setGlobalFont` | EditorPanel、CardPreview |

- 所有 setter 使用 `useCallback` 稳定引用，避免子组件因函数引用变化而重渲染。
- 提供兼容层 `useCardStore()` 合并三个 Hook，旧代码无需修改。
- Provider 内使用 `useState` **惰性初始化**日期（`() => ({...defaultConfig, header: {...}})`），确保日期取应用挂载时的当天，而非模块加载时的固定值。

### 6.2 模板系统（`src/data/templates/`）
- 每个模板是一个 `CardTemplate` 对象，包含 `id`、`name`、`category`、`styles`（`TemplateStyles`）。
- `TemplateStyles` 定义了约 30+ 个视觉属性（背景色、标题色、强调色、代码块配色、引用块样式、列表符号形状等）。
- 当前内置 7 套模板：`warm-parchment`（默认）、`yuankong`、`taijian`、`qingxuan`、`liti`、`zazhi`、`bohesuda`。
- 新增模板只需：在 `src/data/templates/` 新建文件 → 在 `src/data/templates/index.ts` import 并加入 `TEMPLATES` 数组。

### 6.3 富文本编辑器（`src/components/editor/RichEditor.tsx`）
- 基于 TipTap，支持：标题 H1-H3、段落、加粗、斜体、高亮（12 色预设 + 自定义色，上限 100 处）、无序/有序列表、引用块、分割线、图片（本地上传 / 粘贴，>1MB 自动压缩）、表格、代码块。
- 斜杠菜单：输入 `/` 唤起块类型选择（支持键盘上下/回车/Esc）。
- 粘贴图片自动压缩为 WebP（`imageCompressor.ts`）。
- 粘贴外部 HTML 时自动剥离 `<mark>` 高亮标签（`transformPastedHTML`）。
- 编辑器内容变化使用 **300ms 防抖**后再序列化 HTML，减少 `getHTML()` 开销。
- `blob:` URL 生命周期管理：diff 文档树，revoke 已被删除的图片 URL，防止内存泄漏。

### 6.4 卡片预览与导出（`src/components/card/CardPreview.tsx` + `ExportDialog.tsx`）
- **预览优化**：
  - 使用 `useDeferredValue(markdown)` 降低预览渲染优先级，避免阻塞输入。
  - `isStale` 状态时预览区降低透明度 + 轻微模糊，提示用户内容正在同步。
  - Markdown 渲染使用 **16 条 LRU 缓存**（`renderCache`），内容不变时跳过 `md.render()`。
  - `contentStyleTag` 和 `containerStyle` 使用 `useMemo`，样式依赖不变时跳过重建。
- **代码高亮主题**：通过 CDN 动态加载 highlight.js CSS（主 CDN + 备用 CDN 双降级），切换主题时取消上一次未完成的重试链。
- **XSS 防护**：`DOMPurify` 严格白名单过滤标签和属性，并 hook `afterSanitizeAttributes` 移除 `style` 属性中的 `url()` 调用。模板颜色值通过正则 `CSS_COLOR_RE` 校验，防止注入 `}` 等字符破出 CSS 规则。
- **导出流程**（`ExportDialog`）：
  - 格式：PNG / JPG
  - 清晰度：高清(×3)、超清(×4)、极致(×5)、专业(×6)
  - **预热策略**：先以 `scale=1` 调用 `toPng` 强制浏览器缓存字体/CDN资源，再执行正式导出。实测可将高清晰度导出时间从 15s+ 压缩到 8-10s。
  - **动态超时**：按清晰度分级（15s / 25s / 40s / 60s）。
  - **内存估算**：导出前根据 `pixelRatio² × DOM面积 × 4` 估算内存，超过 25MB 时 toast 警告。

### 6.5 字体管理（`src/hooks/useFontManager.ts`）
- **内置字体**：思源黑体、思源宋体、楷体、宋体、微软雅黑（均使用系统字体回退栈）。
- **自定义字体**：用户可上传 `.ttf` / `.otf` / `.woff` / `.woff2`，通过 `FileReader` 转为 base64 data URL。
- **存储策略**：
  - 字体文件 base64 存入 **IndexedDB**（避免 localStorage 5MB 溢出）。
  - localStorage 仅保存轻量元数据（`id`、`name`、`family`），用于首帧快速恢复列表。
  - 支持从旧版 localStorage（`mojika_custom_fonts`）迁移数据到 IndexedDB。
  - iOS Safari 内存压力下会强制关闭 DB 连接，检测 `InvalidStateError` 后自动重置连接，下次调用重新 `open`。
- **FontFace 注册**：带并发去重（`registeringFonts` Map），避免重复加载同一字体。

---

## 7. 自定义规则（`.rules/` + ast-grep）

项目使用 **ast-grep** 进行代码模式扫描，规则定义在 `.rules/*.yml`，由 `.rules/check.sh` 统一调用。

| 规则文件 | 说明 |
|----------|------|
| `SelectItem.yml` | 禁止 `SelectItem` 使用空字符串 `value`（运行时会报错），建议用 `"all"` 代替。 |
| `contrast.yml` | 检测 Button 组件的对比度问题：`outline` + `text-foreground`、默认变体 + `text-primary`、outline + 白/灰文字。 |
| `require-button-interaction.yml` | `<Button>` 必须可交互：需具备 `onClick`、`type="submit"/"reset"`、`asChild`，或包裹在 `*Trigger` / `Link` / `<a>` 中。 |
| `slot-nesting.yml` | 禁止 Radix UI `Trigger`（`asChild`）内直接包裹 `FormControl`，会导致 Slot 双层嵌套、ref 断裂、点击事件丢失。 |
| `supabase-edge-function-get-body.yml` | 禁止 `supabase.functions.invoke` 在 `method: 'GET'` 时携带 `body`（HTTP 规范不允许）。 |
| `supabase-google-sso.yml` | Google 登录应使用 `signInWithSSO` 而非 `signInWithOAuth`，并指定 `domain: 'miaoda-gg.com'`。 |
| `toast-hook.yml` | 禁止从 `@/hooks/use-toast` 导入 `toast`，应使用 `sonner` 的 `import { toast } from "sonner"`。 |
| `useAuth.yml` / `authProvider.yml` | 若使用 `useAuth` Hook 但没有 `AuthProvider` 包裹，则报错（可选规则，文件可能不存在时不影响）。 |

---

## 8. 安全注意事项

1. **XSS 防护**：预览区使用 `DOMPurify` 过滤 HTML，白名单仅包含排版相关标签（`h1-h6`、`p`、`ul/ol/li`、`table`、`code`、`pre`、`blockquote`、`img`、`a` 等），禁止所有事件属性（`onerror`、`onload` 等）。
2. **CSS 注入防护**：
   - DOMPurify hook 移除 `style` 属性中的 `url(...)` 声明，防止外链图片/追踪像素注入。
   - 模板颜色值通过正则 `/^(#([0-9a-fA-F]{3,8})|(rgba?|hsla?)\([^)]{1,80}\))$/` 校验，非法时回退 `transparent`，防止 `}` 等字符破出 CSS 规则。
3. **图片安全**：用户粘贴/上传的图片通过 Canvas 压缩为 WebP，尺寸限制 1920px，质量 0.85，避免超大图片导致前端内存溢出或导出超时。
4. **ObjectURL 内存泄漏**：编辑器组件在卸载时释放所有 `blob:` URL；WidgetsPanel 在卸载时释放水印和头像的 `blob:` URL。
5. **缺失文件**：`src/contexts/AuthContext.tsx` 引用了 `@/db/supabase` 和 `@/types/types`，但 `src/db/` 目录**不存在**，`src/types/types.ts` 也不存在于文件列表中。若需启用认证功能，需补充这些文件。

---

## 9. 性能优化要点（已在代码中实现）

- **React 18 Concurrent Features**：预览区使用 `useDeferredValue`，让输入更新优先于预览渲染。
- **防抖**：编辑器内容变化 300ms 防抖后序列化 HTML；字体/配置 setter 通过稳定引用避免子组件重渲染。
- **缓存**：Markdown 渲染结果使用 16 条固定容量 Map 缓存（FIFO 近似 LRU）。
- **Memoization**：`contentStyleTag`、`containerStyle`、`cssVars`、`TemplateThumbnail` 等均使用 `useMemo` / `React.memo`。
- **CDN 降级**：highlight.js 主题 CSS 加载采用主 CDN + 备用 CDN，带取消机制防止并发切换时互相覆盖。
- **导出预热**：`scale=1` 轻量预热强制缓存字体和 CDN 资源，显著降低高清晰度导出时间。

---

## 10. 开发注意事项

- **不要直接运行 `npm run dev` 或 `npm run build`**：项目配置中这两个脚本被显式禁用，仅用于本地 lint 检查。实际开发和构建由平台（秒哒 / Miaoda）托管。
- **不要修改 `.rules/` 中的规则文件名**：`check.sh` 中硬编码了规则文件路径。
- **新增模板**：只需在 `src/data/templates/` 下新建文件并导出 `CardTemplate`，然后在 `src/data/templates/index.ts` 中 import 加入数组即可，无需修改其他文件。
- **shadcn/ui 组件**：`components.json` 配置使用 `lucide` 图标库，`@/components/ui` 为组件别名。新增 shadcn 组件建议保持统一风格。
- **类型检查排除**：`tsconfig.check.json` 排除了 `src/components/ui`，修改 UI 组件时不会触发类型报错。
- **环境变量**：`.env` 文件存在于项目根目录，但被系统识别为敏感文件（含密钥），具体变量内容未在本次扫描中读取。
