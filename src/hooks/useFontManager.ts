// 字体管理 Hook：内置字体 + 自定义上传
// 字体 base64 存储于 IndexedDB（避免 localStorage ~5MB 溢出）
import { useState, useEffect, useCallback } from 'react';

export interface FontItem {
  id: string;
  name: string;         // 显示名称
  family: string;       // CSS font-family 值
  isBuiltin: boolean;   // 是否内置字体
  dataUrl?: string;     // 自定义字体的 base64 data URL（仅 IndexedDB 内存储）
}

// localStorage 中仅保留轻量元数据（无 dataUrl），用于展示字体列表
interface FontMeta {
  id: string;
  name: string;
  family: string;
}

const DB_NAME = 'mojika_fonts_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_fonts';
const META_KEY = 'mojika_custom_fonts_meta';   // localStorage key（仅存元数据）
const LEGACY_KEY = 'mojika_custom_fonts';       // 旧版 localStorage key（含 base64）

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

// 模块级连接缓存：所有操作复用同一个 Promise<IDBDatabase>，
// 避免每次 dbGetAll/dbPut/dbDelete 都发起新的 indexedDB.open() 握手，
// 防止移动端并发 open 时触发 "The database connection is closing" 异常。
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null; // 打开失败时重置，允许下次重试
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

/**
 * InvalidStateError 自恢复：iOS Safari 在内存压力下会强制关闭 DB 连接。
 * 后续事务会抛出 InvalidStateError（"The database connection is closing"）。
 * 检测到此错误时重置 dbPromise，使下一次调用重新 open DB。
 */
function handleDbError(err: unknown): void {
  if (err instanceof DOMException && err.name === 'InvalidStateError') {
    dbPromise = null;
  }
}

async function dbGetAll(): Promise<FontItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result ?? []) as FontItem[]);
      req.onerror = () => { handleDbError(req.error); reject(req.error); };
    });
  } catch (err) {
    handleDbError(err);
    return [];
  }
}

async function dbPut(font: FontItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(font);
    req.onsuccess = () => resolve();
    req.onerror = () => { handleDbError(req.error); reject(req.error); };
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => { handleDbError(req.error); reject(req.error); };
  });
}

// ─── 元数据 helpers（localStorage，仅存 id/name/family）─────────────────────

function loadFontMeta(): FontMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as FontMeta[]) : [];
  } catch {
    return [];
  }
}

function saveFontMeta(fonts: FontItem[]): void {
  try {
    const meta: FontMeta[] = fonts.map(({ id, name, family }) => ({ id, name, family }));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    console.warn('字体元数据保存失败');
  }
}

// ─── 旧版 localStorage 数据迁移 ──────────────────────────────────────────────

async function migrateLegacyStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const fonts = JSON.parse(raw) as FontItem[];
    // 保证原子性：全部写入 IndexedDB 成功后才删除旧 localStorage 数据。
    // 若 Promise.all 中途失败，localStorage 保留原始数据，下次启动可重试迁移。
    await Promise.all(fonts.map(f => dbPut(f)));
    saveFontMeta(fonts);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // 迁移失败不影响正常使用；旧数据保留，下次启动重试
  }
}

// ─── 内置字体 ─────────────────────────────────────────────────────────────────

export const BUILTIN_FONTS: FontItem[] = [
  { id: 'source-han-sans', name: '思源黑体', family: '"Source Han Sans CN", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif', isBuiltin: true },
  { id: 'source-han-serif', name: '思源宋体', family: '"Source Han Serif CN", "Noto Serif CJK SC", "SimSun", serif', isBuiltin: true },
  { id: 'kaiti', name: '楷体', family: '"KaiTi", "楷体", "STKaiti", "AR PL UKai CN", serif', isBuiltin: true },
  { id: 'simsun', name: '宋体', family: '"SimSun", "宋体", "STSong", serif', isBuiltin: true },
  { id: 'microsoft-yahei', name: '微软雅黑', family: '"Microsoft YaHei", "微软雅黑", "PingFang SC", sans-serif', isBuiltin: true },
];

// ─── FontFace 注册（带并发去重）───────────────────────────────────────────────

const registeringFonts = new Map<string, Promise<void>>();

function registerFontFace(font: FontItem): Promise<void> {
  if (!font.dataUrl) return Promise.resolve();
  if ([...document.fonts].some(f => f.family === `"${font.family}"`)) return Promise.resolve();

  const inflight = registeringFonts.get(font.family);
  if (inflight) return inflight;

  const p = (async () => {
    try {
      const ff = new FontFace(font.family, `url(${font.dataUrl})`);
      await ff.load();
      document.fonts.add(ff);
    } catch {
      console.warn(`字体 ${font.name} 注册失败`);
    } finally {
      registeringFonts.delete(font.family);
    }
  })();

  registeringFonts.set(font.family, p);
  return p;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFontManager() {
  // 初始值从 localStorage 元数据快速恢复（无 dataUrl），避免首帧闪空
  const [customFonts, setCustomFonts] = useState<FontItem[]>(() =>
    loadFontMeta().map(m => ({ ...m, isBuiltin: false }))
  );

  useEffect(() => {
    (async () => {
      // 迁移旧版 localStorage base64 数据至 IndexedDB
      await migrateLegacyStorage();
      // 从 IndexedDB 加载完整数据（含 dataUrl）并注册字体
      const fonts = await dbGetAll();
      if (fonts.length) {
        setCustomFonts(fonts);
        fonts.forEach(f => registerFontFace(f));
      }
    })();
  }, []);

  const allFonts: FontItem[] = [...BUILTIN_FONTS, ...customFonts];

  const uploadFont = useCallback((): Promise<FontItem | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ttf,.otf,.woff,.woff2';

      // 用户取消文件选择对话框时 resolve(null)，避免 Promise 永久悬挂
      // 'cancel' 事件：Chrome 113+，Safari 16.4+，Firefox 91+（主流版本均已支持）
      // window focus 兜底：对话框关闭时 window 重新获得焦点（覆盖更旧的浏览器）
      const onCancel = () => { cleanup(); resolve(null); };
      const onWindowFocus = () => {
        // 延迟 300ms：onchange 可能在 focus 后触发，避免误判为取消
        setTimeout(() => {
          if (!input.files?.length) { cleanup(); resolve(null); }
        }, 300);
      };
      const cleanup = () => {
        input.removeEventListener('cancel', onCancel);
        window.removeEventListener('focus', onWindowFocus);
      };

      input.addEventListener('cancel', onCancel);
      window.addEventListener('focus', onWindowFocus, { once: true });

      input.onchange = async (e) => {
        cleanup();
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) { resolve(null); return; }

        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'ttf';
        const mimeMap: Record<string, string> = {
          ttf: 'font/truetype', otf: 'font/otf',
          woff: 'font/woff', woff2: 'font/woff2',
        };
        const mime = mimeMap[ext] ?? 'font/truetype';

        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = (ev.target?.result as string)
            .replace(/^data:[^;]+/, `data:${mime}`);
          const newFont: FontItem = {
            id: `custom_${Date.now()}`,
            name: file.name.replace(/\.[^.]+$/, ''),
            family: `CustomFont_${Date.now()}`,
            isBuiltin: false,
            dataUrl,
          };

          // 先写 IndexedDB，再注册到浏览器，最后更新 state + 元数据
          // 若 dbPut 失败（如 QuotaExceededError），resolve(null) 而非更新 state，
          // 避免内存状态与 IndexedDB 不同步（页面刷新后字体消失但列表显示有）
          try {
            await dbPut(newFont);
          } catch (e) {
            console.warn('字体写入 IndexedDB 失败，已取消上传:', e);
            resolve(null);
            return;
          }

          await registerFontFace(newFont);

          setCustomFonts(prev => {
            const updated = [...prev, newFont];
            saveFontMeta(updated);
            return updated;
          });
          resolve(newFont);
        };
        // 字体文件损坏或读取中断时，resolve(null) 而非永久悬挂
        reader.onerror = () => { resolve(null); };
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }, []);

  const deleteFont = useCallback((id: string) => {
    // 乐观更新：先从 state 移除（UI 立即响应），再异步删除 IndexedDB
    // 若 DB 删除失败，回滚 state（避免"鬼字体"：state 已删但 DB 仍存，刷新后复活）
    setCustomFonts(prev => {
      const rollback = prev;
      const updated = prev.filter(f => f.id !== id);
      saveFontMeta(updated);

      dbDelete(id).catch((e) => {
        console.warn('字体删除 IndexedDB 失败，已回滚:', e);
        setCustomFonts(rollback);
        saveFontMeta(rollback);
      });

      return updated;
    });
  }, []);

  return { allFonts, customFonts, uploadFont, deleteFont };
}
