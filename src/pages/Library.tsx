import { useMemo, useRef, useState, type ChangeEvent } from 'react';

import type { BirthInput } from '@/engine';
import { parseBackup, serializeBackup } from '@/library/backup';
import { chartSummary, TAG_PRESET_LIST } from '@/library/format';
import { useLibraryStore } from '@/store/useLibraryStore';

interface Props {
  onOpen: (input: BirthInput) => void;
  onBack: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function Library({ onOpen, onBack }: Props) {
  const charts = useLibraryStore((s) => s.charts);
  const remove = useLibraryStore((s) => s.remove);
  const update = useLibraryStore((s) => s.update);
  const importAll = useLibraryStore((s) => s.importAll);
  const backend = useLibraryStore((s) => s.backend);

  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return charts.filter((c) => {
      if (activeTag && !c.tags.includes(activeTag)) return false;
      if (!q) return true;
      const hay = (c.name + ' ' + c.tags.join(' ')).toLowerCase();
      return hay.includes(q);
    });
  }, [charts, query, activeTag]);

  function toggleTag(id: string, tag: string) {
    const chart = charts.find((c) => c.id === id);
    if (!chart) return;
    const tags = chart.tags.includes(tag) ? chart.tags.filter((t) => t !== tag) : [...chart.tags, tag];
    void update(id, { tags });
  }

  function startRename(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  function commitRename(id: string) {
    const name = editingName.trim();
    if (name) void update(id, { name });
    setEditingId(null);
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`确定删除「${name}」？此操作不可撤销。`)) {
      void remove(id);
    }
  }

  function handleExport() {
    if (charts.length === 0) return;
    const { json, filename } = serializeBackup(charts);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允许连续选择同一文件
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      window.alert('读取文件失败，请重试。');
      return;
    }
    const items = parseBackup(text);
    if (items.length === 0) {
      window.alert('这不是本工具导出的盘库备份（.json 文件）。');
      return;
    }
    const ok = window.confirm(
      `将合并 ${items.length} 张命盘：同名命盘会被备份内容覆盖，其余新增，不会删除现有盘库。`,
    );
    if (!ok) return;
    const { imported, updated } = await importAll(items);
    window.alert(`导入完成：新增 ${imported} 张，更新 ${updated} 张。`);
  }

  return (
    <div className="mx-auto max-w-[720px] px-3 pb-10">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center py-3">
        <button
          type="button"
          onClick={onBack}
          className="justify-self-start text-[0.875rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          ← 返回
        </button>
        <h1 className="text-[1.125rem] font-medium" style={{ color: 'var(--ink)' }}>
          我的盘库
        </h1>
        <div className="flex justify-self-end items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="导入盘库备份文件"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-sm px-2.5 py-1 text-[0.75rem]"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}
          >
            导入
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={charts.length === 0}
            className="rounded-sm px-2.5 py-1 text-[0.75rem]"
            style={{
              border: '1px solid var(--border)',
              color: charts.length === 0 ? 'var(--border)' : 'var(--ink-light)',
            }}
            title={charts.length === 0 ? '盘库为空，暂无可导出的命盘' : '导出为 JSON 备份文件'}
          >
            导出
          </button>
        </div>
      </div>

      {backend === 'fallback' && (
        <div
          className="mb-3 rounded-md px-3 py-2 text-[0.75rem]"
          style={{
            background: 'color-mix(in srgb, var(--gold) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--gold) 45%, transparent)',
            color: 'var(--ink-light)',
          }}
        >
          当前浏览器无法使用本地数据库，命盘仅保存在网页缓存中，清理浏览器数据会一并清除。建议定期使用右上角「导出」备份。
        </div>
      )}

      {charts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full text-[2.125rem]"
            style={{ border: '2px solid var(--border)', color: 'var(--gold)' }}
            aria-hidden
          >
            ☯
          </div>
          <p className="mb-1 text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
            还没有命盘
          </p>
          <p className="mb-6 text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
            排一张命盘，它会自动收进这里，方便随时查看与分享
          </p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-sm px-5 py-2 text-[0.875rem] text-white"
            style={{ background: 'var(--grad-btn)' }}
          >
            立即排一张
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索昵称或标签"
              className="w-full rounded-sm px-3 py-2 text-[0.875rem] outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="rounded-full px-3 py-1 text-[0.75rem]"
                style={{
                  border: `1px solid ${activeTag === null ? 'var(--cinnabar)' : 'var(--border)'}`,
                  color: activeTag === null ? 'var(--cinnabar)' : 'var(--ink-light)',
                }}
              >
                全部
              </button>
              {TAG_PRESET_LIST.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="rounded-full px-3 py-1 text-[0.75rem]"
                  style={{
                    border: `1px solid ${activeTag === tag ? 'var(--cinnabar)' : 'var(--border)'}`,
                    color: activeTag === tag ? 'var(--cinnabar)' : 'var(--ink-light)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="rounded-md p-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitRename(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(c.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="text-[0.9375rem] font-medium outline-none"
                      style={{
                        color: 'var(--ink)',
                        borderBottom: '1px solid var(--cinnabar)',
                        background: 'transparent',
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRename(c.id, c.name)}
                      className="text-left text-[0.9375rem] font-medium"
                      style={{ color: 'var(--ink)' }}
                      title="点击重命名"
                    >
                      {c.name}
                    </button>
                  )}
                  <span className="shrink-0 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                    {formatDate(c.updatedAt)}
                  </span>
                </div>

                <p className="mt-1 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
                  {chartSummary(c.input)}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TAG_PRESET_LIST.map((tag) => {
                    const on = c.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(c.id, tag)}
                        className="rounded-full px-2.5 py-0.5 text-[0.6875rem]"
                        style={{
                          border: `1px solid ${on ? 'var(--cinnabar)' : 'var(--border)'}`,
                          color: on ? 'var(--cinnabar)' : 'var(--ink-light)',
                          background: on ? 'color-mix(in srgb, var(--cinnabar) 8%, transparent)' : 'transparent',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(c.input)}
                    className="flex-1 rounded-sm py-1.5 text-[0.8125rem] text-white"
                    style={{ background: 'var(--grad-btn)' }}
                  >
                    打开
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="rounded-sm px-3 py-1.5 text-[0.8125rem]"
                    style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <p className="mt-8 text-center text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
              没有匹配的命盘
            </p>
          )}
        </>
      )}
    </div>
  );
}
