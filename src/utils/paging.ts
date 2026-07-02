/**
 * 分页工具函数
 * 将 HTML 内容按固定卡片高度切成多页。
 *
 * 核心原则：
 * 1. 保持内容原始顺序，不打乱
 * 2. 标题（h1-h3）和它后面的第一个内容块视为一个整体，不分离
 * 3. 列表（ol/ul）可按 <li> 边界跨页拆分，<ol> 自动保持编号连续
 * 4. 引用块、代码块等作为整体不可拆分
 * 5. 以元素为单位进行分页，不在文字中间截断
 * 6. 使用 offsetTop 测量，正确计算 margin 折叠后的实际占用高度
 */

export const ASPECT_RATIOS = ['1:1', '3:4', '3:5', '2:3', '1:2', '9:16', '9:19', '9:21'] as const;

export const DEFAULT_ASPECT_RATIO = '3:4';

/** 根据比例和宽度计算单页高度 */
export function getPageHeight(ratio: string, width: number = 440): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h || w <= 0 || h <= 0) return width * (4 / 3);
  return Math.round(width * (h / w));
}

/** 判断元素是否是标题 */
function isHeading(el: HTMLElement): boolean {
  return /^H[1-6]$/i.test(el.tagName);
}

/** 判断元素是否是列表（ol/ul） */
function isListElement(el: HTMLElement): boolean {
  return el.tagName === 'OL' || el.tagName === 'UL';
}

/** 获取列表中的 <li> 子元素 */
function getListItemElements(listEl: HTMLElement): HTMLElement[] {
  return Array.from(listEl.children).filter(
    (c) => (c as HTMLElement).tagName === 'LI',
  ) as HTMLElement[];
}

/** 获取列表元素的 padding + border 总开销（拆分后每段都有） */
function getListOverhead(listEl: HTMLElement): number {
  const style = window.getComputedStyle(listEl);
  return (
    (parseFloat(style.paddingTop) || 0) +
    (parseFloat(style.paddingBottom) || 0) +
    (parseFloat(style.borderTopWidth) || 0) +
    (parseFloat(style.borderBottomWidth) || 0)
  );
}

/** 安全边距：防止 margin 折叠差异和渲染误差导致截断 */
const SAFETY_MARGIN = 4;

/**
 * 在列表中找到指定剩余空间能容纳的最大 <li> 数量。
 * @param listEl 列表 DOM 元素（需已在文档中渲染）
 * @param remainingHeight 当前页剩余可用高度（列表元素可用的总高度，含 padding/border）
 * @returns 可容纳的 <li> 数量（0 = 连一个都放不下）
 */
function findListSplitPoint(listEl: HTMLElement, remainingHeight: number): number {
  const items = getListItemElements(listEl);
  if (items.length === 0) return 0;

  const style = window.getComputedStyle(listEl);
  const padTop = parseFloat(style.paddingTop) || 0;
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const overhead = getListOverhead(listEl);

  const usable = remainingHeight - overhead - SAFETY_MARGIN;
  if (usable <= 0) return 0;

  let count = 0;
  for (let i = 0; i < items.length; i++) {
    const itemStyle = window.getComputedStyle(items[i]);
    const marginBottom = parseFloat(itemStyle.marginBottom) || 0;
    const relBottom = items[i].offsetTop + items[i].offsetHeight + marginBottom - listEl.offsetTop - padTop - borderTop;
    if (relBottom <= usable) {
      count = i + 1;
    } else {
      break;
    }
  }
  return count;
}

/**
 * 从指定 <li> 索引开始，找到一页能放下的最大 <li> 数量。
 */
function findListSplitPointFrom(listEl: HTMLElement, fromIdx: number, availableHeight: number): number {
  const items = getListItemElements(listEl);
  if (fromIdx >= items.length) return 0;

  const overhead = getListOverhead(listEl);
  const usable = availableHeight - overhead - SAFETY_MARGIN;
  if (usable <= 0) return 0;

  let count = 0;
  let accHeight = 0;
  for (let i = fromIdx; i < items.length; i++) {
    const itemStyle = window.getComputedStyle(items[i]);
    const itemH = (parseFloat(itemStyle.marginTop) || 0) + items[i].offsetHeight + (parseFloat(itemStyle.marginBottom) || 0);
    if (accHeight + itemH <= usable) {
      accHeight += itemH;
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * 生成列表中指定范围 <li> 的 HTML 片段。
 * <ol> 拆分后通过内联 counter-reset 保持编号连续（CSS 自定义计数器不识别 start 属性）。
 */
function buildListPartHtml(listEl: HTMLElement, fromIdx: number, toIdx: number): string {
  const tag = listEl.tagName.toLowerCase();
  const items = getListItemElements(listEl);
  const partItems = items.slice(fromIdx, toIdx);

  let existingStyle = '';
  let otherAttrs = '';
  for (const attr of Array.from(listEl.attributes)) {
    if (attr.name === 'style') {
      existingStyle = attr.value;
    } else {
      otherAttrs += ` ${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`;
    }
  }

  if (tag === 'ol' && fromIdx > 0) {
    const counterReset = `counter-reset: ol-counter ${fromIdx}`;
    existingStyle = existingStyle ? `${existingStyle}; ${counterReset}` : counterReset;
  }

  const styleAttr = existingStyle ? ` style="${existingStyle.replace(/"/g, '&quot;')}"` : '';
  const startAttr = tag === 'ol' ? ` start="${fromIdx + 1}"` : '';

  return `<${tag}${otherAttrs}${startAttr}${styleAttr}>${partItems.map((li) => li.outerHTML).join('')}</${tag}>`;
}

/**
 * 测量列表中指定范围 <li> 项在拆分后的估算高度（含列表 padding/border 开销）。
 */
function estimateListPartHeight(listEl: HTMLElement, fromIdx: number, toIdx: number): number {
  const items = getListItemElements(listEl);
  if (fromIdx >= items.length || toIdx > items.length || fromIdx >= toIdx) return 0;

  const itemsHeight = items[toIdx - 1].offsetTop + items[toIdx - 1].offsetHeight - items[fromIdx].offsetTop;
  return itemsHeight + getListOverhead(listEl);
}

/**
 * 将列表元素按页拆分为多段，返回每段的 HTML 和估算高度。
 */
function splitListIntoParts(
  listEl: HTMLElement,
  fromIdx: number,
  firstPageHeight: number,
  pageHeight: number,
): { html: string; height: number }[] {
  const totalItems = getListItemElements(listEl).length;
  if (fromIdx >= totalItems) return [];

  const parts: { html: string; height: number }[] = [];
  let currentIdx = fromIdx;
  let isFirstPage = true;

  while (currentIdx < totalItems) {
    const available = isFirstPage ? firstPageHeight : pageHeight;
    let fitCount = findListSplitPointFrom(listEl, currentIdx, available);
    if (fitCount === 0) fitCount = 1;

    const endIdx = currentIdx + fitCount;
    const html = buildListPartHtml(listEl, currentIdx, endIdx);
    const height = estimateListPartHeight(listEl, currentIdx, endIdx);

    parts.push({ html, height });
    currentIdx = endIdx;
    isFirstPage = false;
  }

  return parts;
}

/**
 * 将列表拆分片段分配到各页。
 * 每个片段独占一页或与前面的片段共页（如果空间允许）。
 */
function distributeListParts(
  parts: { html: string; height: number }[],
  pages: string[][],
  currentPage: string[],
  currentPageHeight: number,
  availableHeight: number,
): { currentPage: string[]; currentPageHeight: number } {
  let page = [...currentPage];
  let height = currentPageHeight;

  for (const part of parts) {
    if (page.length > 0 && height + part.height > availableHeight) {
      pages.push([...page]);
      page = [];
      height = 0;
    }
    page.push(part.html);
    height += part.height;
  }

  return { currentPage: page, currentPageHeight: height };
}

/** 将 HTML 内容按可用高度分页，返回每页的 HTML 字符串数组 */
export function splitContentIntoPages(
  htmlContent: string,
  pageHeight: number,
  reservedHeight: number = 160,
  width: number = 440,
  padding: string = '28px',
  fontSize?: number,
  lineHeight?: number,
  fontFamily?: string,
  cssVars?: Record<string, string>,
): string[] {
  if (!htmlContent.trim()) return [''];

  const measureDiv = document.createElement('div');
  measureDiv.style.cssText = `
    position: fixed;
    visibility: hidden;
    width: ${width}px;
    padding: ${padding};
    box-sizing: border-box;
    pointer-events: none;
    z-index: -9999;
    top: 0;
    left: 0;
  `;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'card-render';
  const fs = fontSize ? `${fontSize * 15}px` : '15px';
  const lh = lineHeight ? String(lineHeight) : '1.6';
  const ff = fontFamily || 'inherit';
  contentDiv.style.cssText = `position: relative; padding: 0; margin: 0; width: 100%; font-size: ${fs}; line-height: ${lh}; font-family: ${ff};`;
  if (cssVars) {
    const cssVarStr = Object.entries(cssVars)
      .map(([k, v]) => `${k}: ${v};`)
      .join(' ');
    contentDiv.style.cssText += ` ${cssVarStr}`;
  }
  contentDiv.innerHTML = htmlContent;

  measureDiv.appendChild(contentDiv);
  document.body.appendChild(measureDiv);

  const children = Array.from(contentDiv.children).filter((child) => {
    const el = child as HTMLElement;
    // 保留空段落（用户主动输入的空行），只过滤 offsetHeight 为 0 的不可见元素
    return el.offsetHeight > 0;
  }) as HTMLElement[];
  if (children.length === 0) {
    document.body.removeChild(measureDiv);
    return [htmlContent];
  }

  // 获取每个元素在容器中的实际位置
  const positions = children.map((child) => ({
    top: child.offsetTop,
    bottom: child.offsetTop + child.offsetHeight,
    height: child.offsetHeight,
  }));

  // 计算从索引 start 到 end（含）的元素组实际占用高度
  // 使用 positions[end].bottom - positions[start].top 自动包含元素间 margin
  const getGroupHeight = (start: number, end: number): number => {
    if (start > end) return 0;
    if (start === end) return positions[start].height;
    return positions[end].bottom - positions[start].top;
  };

  const availableHeight = Math.max(pageHeight - reservedHeight - 4, 80);

  const pages: string[][] = [];
  let currentPage: string[] = [];
  let pageStartIdx = 0; // 当前页第一个 DOM 子元素索引

  /** 推入当前页并开始新页 */
  const flushPage = () => {
    if (currentPage.length > 0) {
      pages.push([...currentPage]);
    }
    currentPage = [];
  };

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const nextChild = i + 1 < children.length ? children[i + 1] : null;

    // ── 标题 + 后续内容绑定策略 ──
    if (isHeading(child) && nextChild && !isHeading(nextChild)) {
      // getGroupHeight(pageStartIdx, i+1) = 当前页首元素到第 i+1 个元素底部的总高度
      const fitsOnPage = currentPage.length === 0 || getGroupHeight(pageStartIdx, i + 1) <= availableHeight;

      if (fitsOnPage) {
        if (currentPage.length === 0) pageStartIdx = i;
        currentPage.push(child.outerHTML, nextChild.outerHTML);
        i++;
        continue;
      }

      // ── 标题 + 列表：尝试拆分列表 ──
      if (isListElement(nextChild)) {
        // positions[i+1].top - positions[pageStartIdx].top = 从页首到列表顶部的已用高度
        const usedBeforeList = positions[i + 1].top - positions[pageStartIdx].top;
        const remainingForList = availableHeight - usedBeforeList;

        if (remainingForList > 0) {
          const splitPoint = findListSplitPoint(nextChild, remainingForList);
          if (splitPoint > 0) {
            // 标题 + 列表前半段留在当前页
            currentPage.push(child.outerHTML, buildListPartHtml(nextChild, 0, splitPoint));

            // 列表后半段按页拆分
            const totalItems = getListItemElements(nextChild).length;
            if (splitPoint < totalItems) {
              // 当前页的已用高度（用 getGroupHeight 精确计算到列表顶部 + 前半段估算）
              const firstPartHeight = estimateListPartHeight(nextChild, 0, splitPoint);
              const currentH = usedBeforeList + firstPartHeight;

              flushPage();
              const remainingParts = splitListIntoParts(nextChild, splitPoint, availableHeight, availableHeight);
              const result = distributeListParts(remainingParts, pages, [], 0, availableHeight);
              currentPage = result.currentPage;
              // pageStartIdx 不再准确（页内包含列表拆分片段），但下一轮循环会重置
            }

            i += 2;
            continue;
          }
        }

        // 拆分失败，整个组移到下一页
        flushPage();
        pageStartIdx = i;
        currentPage.push(child.outerHTML, nextChild.outerHTML);
        i++;
        continue;
      }

      // ── 标题 + 非列表内容：整体移到下一页 ──
      flushPage();
      pageStartIdx = i;
      currentPage.push(child.outerHTML, nextChild.outerHTML);
      i++;
      continue;
    }

    // ── 普通元素 ──
    // getGroupHeight(pageStartIdx, i) = 当前页首元素到第 i 个元素底部的总高度
    const fitsOnPage = currentPage.length === 0 || getGroupHeight(pageStartIdx, i) <= availableHeight;

    if (fitsOnPage) {
      if (currentPage.length === 0) pageStartIdx = i;
      currentPage.push(child.outerHTML);
      continue;
    }

    // ── 列表放不下：尝试按 <li> 拆分 ──
    if (isListElement(child)) {
      // positions[i].top - positions[pageStartIdx].top = 从页首到列表顶部的已用高度
      const usedBeforeList = positions[i].top - positions[pageStartIdx].top;
      const remainingForList = availableHeight - usedBeforeList;

      if (remainingForList > 0) {
        const splitPoint = findListSplitPoint(child, remainingForList);
        if (splitPoint > 0) {
          // 前半段留在当前页
          currentPage.push(buildListPartHtml(child, 0, splitPoint));

          // 后半段按页拆分
          const totalItems = getListItemElements(child).length;
          if (splitPoint < totalItems) {
            flushPage();
            const remainingParts = splitListIntoParts(child, splitPoint, availableHeight, availableHeight);
            const result = distributeListParts(remainingParts, pages, [], 0, availableHeight);
            currentPage = result.currentPage;
          }

          i++;
          continue;
        }
      }

      // 拆分失败，整个列表移到下一页
      if (currentPage.length === 0) {
        pageStartIdx = i;
        currentPage.push(child.outerHTML);
      } else {
        flushPage();
        pageStartIdx = i;
        currentPage.push(child.outerHTML);
      }
      continue;
    }

    // ── 非列表元素放不下 → 移到下一页 ──
    if (currentPage.length === 0) {
      pageStartIdx = i;
      currentPage.push(child.outerHTML);
    } else {
      flushPage();
      pageStartIdx = i;
      currentPage.push(child.outerHTML);
    }
  }

  // 最后一页
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  document.body.removeChild(measureDiv);

  return pages
    .map((page) => page.join(''))
    .filter((page) => page.trim() !== '');
}

// ─── 分页结果缓存（LRU，4 条） ─────────────────────────────────────────────────

interface PagedContentsCache {
  key: string;
  contents: string[];
}

const LRU_CAPACITY = 4;
const pagedContentsCacheList: PagedContentsCache[] = [];

export function getPagedContentsCache(): PagedContentsCache | null {
  return pagedContentsCacheList.find(c => true) ?? null;
}

export function getPagedContentsCacheByKey(key: string): PagedContentsCache | null {
  const idx = pagedContentsCacheList.findIndex(c => c.key === key);
  if (idx === -1) return null;
  const item = pagedContentsCacheList.splice(idx, 1)[0];
  pagedContentsCacheList.unshift(item);
  return item;
}

export function setPagedContentsCache(key: string, contents: string[]): void {
  const existingIdx = pagedContentsCacheList.findIndex(c => c.key === key);
  if (existingIdx !== -1) {
    pagedContentsCacheList.splice(existingIdx, 1);
  }
  pagedContentsCacheList.unshift({ key, contents });
  while (pagedContentsCacheList.length > LRU_CAPACITY) {
    pagedContentsCacheList.pop();
  }
}

export function generatePagedContentsCacheKey(
  htmlContent: string,
  aspectRatio: string,
  reservedHeight: number,
  baseFontSize: number,
  lineHeight: number,
  globalFont: string,
  cssVars?: string,
): string {
  return JSON.stringify({
    htmlContent,
    aspectRatio,
    reservedHeight,
    baseFontSize,
    lineHeight,
    globalFont,
    cssVars,
  });
}
