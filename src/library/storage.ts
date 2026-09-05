import type { SavedChart } from './types';

/**
 * 盘库持久化层（PRD 9.6：IndexedDB，存输入参数）。
 * 浏览器环境使用 IndexedDB；若不可用（如测试/极端环境）降级到 localStorage，
 * 保证不抛异常、不阻塞 UI。
 */

const DB_NAME = 'zwdz-library';
const STORE = 'charts';
const LS_KEY = 'zwdz-library';
const VERSION = 1;

const hasIDB = typeof indexedDB !== 'undefined';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(): Promise<SavedChart[]> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as SavedChart[]);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    }, reject);
  });
}

function idbPut(chart: SavedChart): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(chart);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    }, reject);
  });
}

function idbDelete(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    }, reject);
  });
}

function lsGetAll(): SavedChart[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedChart[]) : [];
  } catch {
    return [];
  }
}

function lsSaveAll(charts: SavedChart[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(charts));
  } catch {
    /* 忽略写入失败（如隐私模式） */
  }
}

export async function listCharts(): Promise<SavedChart[]> {
  const all = hasIDB
    ? await idbGetAll().catch(() => lsGetAll())
    : lsGetAll();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putChart(chart: SavedChart): Promise<void> {
  if (hasIDB) {
    await idbPut(chart).catch(() => {
      const all = lsGetAll().filter((c) => c.id !== chart.id);
      lsSaveAll([chart, ...all]);
    });
    return;
  }
  const all = lsGetAll().filter((c) => c.id !== chart.id);
  lsSaveAll([chart, ...all]);
}

export async function deleteChart(id: string): Promise<void> {
  if (hasIDB) {
    await idbDelete(id).catch(() => lsSaveAll(lsGetAll().filter((c) => c.id !== id)));
    return;
  }
  lsSaveAll(lsGetAll().filter((c) => c.id !== id));
}

/**
 * 清除本机全部数据（PRD 9.6 清理能力 / 第 8 章隐私）。
 * 同时删除 IndexedDB 数据库与 localStorage，执行后不可恢复。
 */
export async function clearAll(): Promise<void> {
  if (hasIDB) {
    await new Promise<void>((resolve) => {
      try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  try {
    localStorage.clear();
  } catch {
    /* 忽略：隐私模式下可能不可写 */
  }
}

/** 探测实际持久化后端：IndexedDB 是否真实可用（打开成功） */
export async function probeBackend(): Promise<'idb' | 'fallback'> {
  if (!hasIDB) return 'fallback';
  try {
    await openDB();
    return 'idb';
  } catch {
    return 'fallback';
  }
}

/** 批量合并写入（导入备份用）：同 id 覆盖，其余追加 */
export async function mergeCharts(items: SavedChart[]): Promise<void> {
  if (items.length === 0) return;
  if (hasIDB) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        for (const chart of items) store.put(chart);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      });
      return;
    } catch {
      /* 降级 localStorage */
    }
  }
  const map = new Map(lsGetAll().map((c) => [c.id, c]));
  for (const chart of items) map.set(chart.id, chart);
  lsSaveAll([...map.values()]);
}
