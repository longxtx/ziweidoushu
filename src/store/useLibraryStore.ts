import { create } from 'zustand';

import type { BirthInput } from '@/engine';
import type { SavedChart } from '@/library/types';
import { defaultName } from '@/library/format';
import { deleteChart, listCharts, mergeCharts, probeBackend, putChart } from '@/library/storage';

function genId(): string {
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 用排盘输入参数（不含昵称/标签）做去重键 */
function inputKey(input: BirthInput): string {
  return JSON.stringify(input);
}

interface LibraryState {
  charts: SavedChart[];
  loaded: boolean;
  load: () => Promise<void>;
  /** 保存当前命盘：已存在同名参数则更新，否则新建 */
  saveCurrent: (input: BirthInput, name?: string, tags?: string[]) => Promise<SavedChart>;
  update: (id: string, patch: Partial<Pick<SavedChart, 'name' | 'tags'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  findByInput: (input: BirthInput) => SavedChart | undefined;
  /** 当前持久化后端：IndexedDB 正常为 'idb'，降级到 localStorage 为 'fallback' */
  backend: 'idb' | 'fallback';
  /** 合并导入备份（同 id 覆盖、其余追加），返回新增/更新数量 */
  importAll: (items: SavedChart[]) => Promise<{ imported: number; updated: number }>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  charts: [],
  loaded: false,
  backend: 'idb',

  load: async () => {
    const [charts, backend] = await Promise.all([listCharts(), probeBackend()]);
    set({ charts, loaded: true, backend });
  },

  saveCurrent: async (input, name, tags) => {
    const existing = get().charts.find((c) => inputKey(c.input) === inputKey(input));
    const now = Date.now();
    const chart: SavedChart = existing
      ? { ...existing, name: name ?? existing.name, tags: tags ?? existing.tags, updatedAt: now }
      : { id: genId(), name: name ?? defaultName(input), tags: tags ?? [], input, createdAt: now, updatedAt: now };
    await putChart(chart);
    set({
      charts: [chart, ...get().charts.filter((c) => c.id !== chart.id)].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
    });
    return chart;
  },

  update: async (id, patch) => {
    const target = get().charts.find((c) => c.id === id);
    if (!target) return;
    const next: SavedChart = { ...target, ...patch, updatedAt: Date.now() };
    await putChart(next);
    set({ charts: get().charts.map((c) => (c.id === id ? next : c)) });
  },

  remove: async (id) => {
    await deleteChart(id);
    set({ charts: get().charts.filter((c) => c.id !== id) });
  },

  importAll: async (items) => {
    const existing = get().charts;
    const merged = [...existing];
    const byId = new Map(existing.map((c) => [c.id, c]));
    let imported = 0;
    let updated = 0;
    for (const item of items) {
      if (byId.has(item.id)) {
        merged[merged.findIndex((c) => c.id === item.id)] = item;
        updated += 1;
      } else {
        merged.push(item);
        imported += 1;
      }
      byId.set(item.id, item);
    }
    await mergeCharts(merged);
    set({ charts: merged.sort((a, b) => b.updatedAt - a.updatedAt) });
    return { imported, updated };
  },

  findByInput: (input) => get().charts.find((c) => inputKey(c.input) === inputKey(input)),
}));
