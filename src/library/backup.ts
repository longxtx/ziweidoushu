import type { SavedChart } from './types';

/**
 * 盘库备份编解码（JSON 下载/导入恢复）。
 * 仅含 SavedChart（即排盘输入参数，无真实姓名），符合 PRD 9.6 隐私要求。
 */

const APP_TAG = 'ziwei-lab';
const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof APP_TAG;
  version: number;
  exportedAt: number;
  charts: SavedChart[];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 序列化盘库为下载 JSON 文本与文件名 */
export function serializeBackup(charts: SavedChart[]): { json: string; filename: string } {
  const file: BackupFile = {
    app: APP_TAG,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    charts,
  };
  const d = new Date();
  const filename = `紫微斗数盘库备份_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  return { json: JSON.stringify(file, null, 2), filename };
}

function isSavedChart(x: unknown): x is SavedChart {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    Array.isArray(c.tags) &&
    typeof c.input === 'object' &&
    c.input !== null &&
    typeof c.createdAt === 'number' &&
    typeof c.updatedAt === 'number'
  );
}

/** 解析备份文本，非本工具格式返回空数组 */
export function parseBackup(text: string): SavedChart[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  // 兼容两种形态：顶层数组（旧备份）或 { app, charts }
  const raw: unknown = Array.isArray(data) ? data : (data as { charts?: unknown })?.charts;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSavedChart);
}
