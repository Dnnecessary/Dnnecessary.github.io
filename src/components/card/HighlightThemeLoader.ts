/**
 * highlight.js 代码主题加载：主 CDN + 备用 CDN 双降级。
 * 避免使用 ?raw 静态导入（与平台 Vite 插件存在兼容问题，会导致模块初始化失败）。
 *
 * 并发安全：每次调用生成独立 `active` 标志。主题切换时，上一次的回调检测到
 * `active === false` 后立即停止重试，避免多次并发调用互相覆盖 onerror 导致
 * 降级重试链断裂（场景：用户快速连续切换代码主题）。
 */

const CODE_THEME_URLS: Record<string, string[]> = {
  dark:      [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-dark.min.css',
  ],
  light:     [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-light.min.css',
  ],
  github:    [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css',
  ],
  monokai:   [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/monokai.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/monokai.min.css',
  ],
  solarized: [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/solarized-dark.min.css',
    'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/base16/solarized-dark.min.css',
  ],
};

let _currentThemeHandle: { cancel: () => void } | null = null;

export function loadHighlightTheme(theme: string) {
  // 取消上一次尚未完成的重试链
  if (_currentThemeHandle) {
    _currentThemeHandle.cancel();
    _currentThemeHandle = null;
  }

  const urls = CODE_THEME_URLS[theme] ?? CODE_THEME_URLS.dark;
  const id = 'hljs-theme';
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = 'stylesheet';
    document.head.appendChild(el);
  }

  // 每次调用独立的 active 标志，旧调用的回调在 cancel() 后不再继续
  let active = true;
  _currentThemeHandle = { cancel: () => { active = false; } };

  let idx = 0;
  const tryNext = () => {
    if (!active || idx >= urls.length) return;
    el!.href = urls[idx];
    el!.onerror = () => { if (active) { idx++; tryNext(); } };
    idx++;
  };
  tryNext();
}
