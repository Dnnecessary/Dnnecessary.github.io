/**
 * highlight.js 代码主题加载：主 CDN + 备用 CDN 双降级。
 *
 * 关键设计：使用 fetch() 获取 CSS 内容后以 <style> 内联，而非 <link> 外链。
 * 原因：html-to-image 导出时需要把所有外部样式表内联到 DOM 中。
 * 如果使用 <link>，html-to-image 需要在导出瞬间 fetch CDN 资源，
 * CDN 不支持 CORS 时 fetch 会挂起导致导出超时。
 * 使用 <style> 内联后，html-to-image 无需 fetch 任何外部资源。
 *
 * 并发安全：每次调用生成独立 `active` 标志。主题切换时，上一次的回调检测到
 * `active === false` 后立即停止重试，避免多次并发调用互相覆盖导致
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

/** 已加载的 CSS 缓存，避免重复 fetch 同一 URL */
const cssCache = new Map<string, string>();

export function loadHighlightTheme(theme: string) {
  // 取消上一次尚未完成的重试链
  if (_currentThemeHandle) {
    _currentThemeHandle.cancel();
    _currentThemeHandle = null;
  }

  const urls = CODE_THEME_URLS[theme] ?? CODE_THEME_URLS.dark;
  const id = 'hljs-theme';
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }

  // 每次调用独立的 active 标志，旧调用的回调在 cancel() 后不再继续
  let active = true;
  _currentThemeHandle = { cancel: () => { active = false; } };

  let idx = 0;
  const tryNext = async () => {
    if (!active || idx >= urls.length) return;
    const url = urls[idx];
    idx++;

    // 命中缓存直接内联
    const cached = cssCache.get(url);
    if (cached) {
      el!.textContent = cached;
      return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const css = await res.text();
      cssCache.set(url, css);
      if (active) {
        el!.textContent = css;
      }
    } catch {
      // 当前 CDN 失败，尝试备用 CDN
      if (active) tryNext();
    }
  };
  tryNext();
}
