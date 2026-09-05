/**
 * PRD 15.3 卡点：扫描硬编码色值。
 *
 * 全项目色值只允许出现在设计令牌文件（src/styles/tokens.css），
 * 组件内一律通过 var(--token) 引用（PRD 6.1 原则 4）。
 * 发现违规即以退出码 1 阻断，供 CI 与本地提交前使用。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ALLOWED = new Set(['src/styles/tokens.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.codebuddy', 'coverage', '.vite']);
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

// 覆盖 hex、rgb/rgba/hsl/hsla 与渐变函数
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\(|(?:linear|radial)-gradient\(/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (EXTS.has(name.slice(name.lastIndexOf('.')))) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];

for (const file of walk(join(ROOT, 'src'))) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWED.has(rel)) continue;

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // 跳过注释（说明性文字中提及色值不算违规）
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
    ) {
      return;
    }
    if (COLOR_RE.test(line)) {
      violations.push(`${rel}:${i + 1}\n    ${trimmed.slice(0, 120)}`);
    }
  });
}

if (violations.length > 0) {
  console.error(`✖ 发现 ${violations.length} 处硬编码色值（PRD 15.3 阻断合并）：\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\n请在 src/styles/tokens.css 新增令牌后以 var(--token) 引用。');
  process.exit(1);
}

console.log('✓ 未发现硬编码色值：色值仅存在于 src/styles/tokens.css');
