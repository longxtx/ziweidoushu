/**
 * PRD 9.7 包体预算：首屏 JS ≤ 200KB（gzip），CI 卡点（PRD 15.3）。
 *
 * 统计口径：dist/index.html 直接引用的资源（入口 JS、CSS 与 modulepreload 的静态依赖）。
 * 排盘引擎、命盘页、盘库、合盘等为按需懒加载分包，不计入首屏。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const BUDGET_KB = 200;
const DIST = join(process.cwd(), 'dist');

let html;
try {
  html = readFileSync(join(DIST, 'index.html'), 'utf8');
} catch {
  console.error('✖ 未找到 dist/index.html，请先执行 npm run build');
  process.exit(1);
}

// 提取入口引用的资源（含 modulepreload 的静态依赖）
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)) {
  refs.add(m[1]);
}

let total = 0;
const rows = [];
for (const name of refs) {
  let buf;
  try {
    buf = readFileSync(join(DIST, 'assets', name));
  } catch {
    continue;
  }
  const gz = gzipSync(buf).length;
  total += gz;
  rows.push(`  ${name.padEnd(28)} ${(gz / 1024).toFixed(2)} KB`);
}

const totalKb = total / 1024;
console.log('首屏产物（gzip）：');
for (const r of rows) console.log(r);
console.log(`\n合计 ${totalKb.toFixed(2)} KB / 预算 ${BUDGET_KB} KB`);

if (totalKb > BUDGET_KB) {
  console.error(`\n✖ 首屏超出包体预算（PRD 9.7：首屏 JS ≤ ${BUDGET_KB}KB gzip）`);
  process.exit(1);
}

console.log('✓ 首屏包体在预算内');

// 文档不得进入部署产物：md 仅存于仓库做备份，不部署到线上
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const mdInDist = walk(DIST).filter((f) => f.toLowerCase().endsWith('.md'));

if (mdInDist.length > 0) {
  console.error(`\n✖ 部署产物中发现 ${mdInDist.length} 个 md 文件（文档不应部署）：`);
  for (const f of mdInDist) console.error('  ' + relative(process.cwd(), f));
  process.exit(1);
}

console.log('✓ 部署产物不含 md 文档');
