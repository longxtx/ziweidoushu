import { BRANCH_GRID } from '@/constants';
import type { BirthInput, Chart } from '@/engine';
import { genderLabel } from './format';

/**
 * 导出分享图（PRD F5 / 11.3）
 *
 * 规格：750×1000，含十二宫盘面缩略图 + 钩子文案 + 品牌印章。
 * 隐私硬约束（PRD 11.3 / 15.4）：**不含**姓名、具体出生日期与出生地点。
 *
 * 色值取自 --export-* 令牌（hex 仅存在于 tokens.css），恒为宣纸浅色：
 * 深色主题下导出仍为浅色盘面（PRD 15.3）。
 */
function token(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const KAI = '"KaiTi","STKaiti","Noto Serif SC",serif';
const SANS = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';

export function exportChartImage(chart: Chart, input: BirthInput): void {
  const dpr = 2;
  const W = 750;
  const H = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const bg = token('--export-bg');
  const ink = token('--export-ink');
  const inkLight = token('--export-ink-light');
  const cinnabar = token('--export-cinnabar');
  const gold = token('--export-gold');
  const border = token('--export-border');
  const onAccent = token('--export-on-accent');

  // 宣纸底 + 顶部装饰线
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, token('--export-grad-0'));
  grad.addColorStop(0.5, token('--export-grad-1'));
  grad.addColorStop(1, token('--export-grad-2'));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 8);

  // 印章：朱砂圆角方块 + 白字「紫」
  ctx.fillStyle = cinnabar;
  const sealSize = 52;
  const sealX = 40;
  const sealY = 40;
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(sealX + r, sealY);
  ctx.lineTo(sealX + sealSize - r, sealY);
  ctx.quadraticCurveTo(sealX + sealSize, sealY, sealX + sealSize, sealY + r);
  ctx.lineTo(sealX + sealSize, sealY + sealSize - r);
  ctx.quadraticCurveTo(sealX + sealSize, sealY + sealSize, sealX + sealSize - r, sealY + sealSize);
  ctx.lineTo(sealX + r, sealY + sealSize);
  ctx.quadraticCurveTo(sealX, sealY + sealSize, sealX, sealY + sealSize - r);
  ctx.lineTo(sealX, sealY + r);
  ctx.quadraticCurveTo(sealX, sealY, sealX + r, sealY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = onAccent;
  ctx.font = `600 30px ${KAI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('紫', sealX + sealSize / 2, sealY + sealSize / 2 + 1);

  // 标题
  ctx.fillStyle = ink;
  ctx.font = `600 32px ${KAI}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('紫微斗数命盘', sealX + sealSize + 16, sealY + 34);

  // 基本信息（不含出生日期 / 地点 / 姓名）
  const soul = chart.palaces[chart.soulPalaceIndex];
  const body = chart.palaces[chart.bodyPalaceIndex];
  const majorNames = soul.majorStars.map((s) => s.name).join('');
  ctx.font = `14px ${SANS}`;
  const meta = [
    `性别 ${genderLabel(input)}`,
    `干支 ${chart.chineseDate}`,
    `五行局 ${chart.fiveElementsClass}`,
    `命宫 ${soul.earthlyBranch}${majorNames ? ' · ' + majorNames : ''}`,
    `身宫 ${body.earthlyBranch}`,
    `命主 ${chart.soul} · 身主 ${chart.body}`,
  ].join('　');
  ctx.fillStyle = inkLight;
  ctx.fillText(meta, sealX, sealY + sealSize + 26);

  // ---------- 十二宫盘面缩略图 ----------
  const gridSize = 560;
  const gx = (W - gridSize) / 2;
  const gy = 208;
  const cell = gridSize / 4;
  const gap = 4;

  for (const p of chart.palaces) {
    const pos = BRANCH_GRID[p.earthlyBranch];
    const x = gx + (pos.col - 1) * cell;
    const y = gy + (pos.row - 1) * cell;
    const w = cell - gap;

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, w);

    // 宫名（命宫朱砂）
    ctx.fillStyle = p.index === chart.soulPalaceIndex ? cinnabar : ink;
    ctx.font = `13px ${KAI}`;
    ctx.textAlign = 'left';
    ctx.fillText(p.name, x + 6, y + 18);

    // 宫位干支
    ctx.fillStyle = inkLight;
    ctx.font = `10px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${p.heavenlyStem}${p.earthlyBranch}`, x + w - 6, y + 17);

    // 主星（最多 3 行，超出记 +N）
    ctx.textAlign = 'center';
    ctx.font = `14px ${KAI}`;
    let ty = y + 40;
    const shown = p.majorStars.slice(0, 3);
    for (const s of shown) {
      ctx.fillStyle = ink;
      ctx.fillText(s.name, x + w / 2, ty);
      if (s.mutagen) {
        ctx.fillStyle = gold;
        ctx.font = `10px ${SANS}`;
        ctx.fillText(s.mutagen, x + w / 2 + ctx.measureText(s.name).width / 2 + 8, ty - 2);
        ctx.font = `14px ${KAI}`;
      }
      ty += 20;
    }
    if (p.majorStars.length > 3) {
      ctx.fillStyle = inkLight;
      ctx.font = `10px ${SANS}`;
      ctx.fillText(`+${p.majorStars.length - 3}`, x + w / 2, ty);
    } else if (p.majorStars.length === 0) {
      ctx.fillStyle = inkLight;
      ctx.font = `12px ${SANS}`;
      ctx.fillText('空宫', x + w / 2, y + 40);
    }
  }

  // 中宫：命主 / 身主 / 五行局
  const cx = gx + cell;
  const cy = gy + cell;
  const cw = cell * 2 - gap;
  ctx.strokeStyle = border;
  ctx.strokeRect(cx, cy, cw, cw);
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `15px ${KAI}`;
  ctx.fillText(`命主 ${chart.soul}　身主 ${chart.body}`, cx + cw / 2, cy + cw / 2 - 6);
  ctx.fillStyle = gold;
  ctx.font = `14px ${KAI}`;
  ctx.fillText(chart.fiveElementsClass, cx + cw / 2, cy + cw / 2 + 18);
  ctx.fillStyle = inkLight;
  ctx.font = `11px ${SANS}`;
  ctx.fillText(chart.zodiac, cx + cw / 2, cy + cw / 2 + 40);

  // ---------- 钩子文案（不含隐私信息） ----------
  const hookY = gy + gridSize + 46;
  const hooks: string[] = [];
  if (chart.correction && Math.abs(chart.correction.offsetMinutes) >= 1) {
    hooks.push(`这张盘校正了 ${Math.round(chart.correction.offsetMinutes)} 分钟真太阳时`);
  }
  if (majorNames) {
    hooks.push(`我的命宫是${majorNames}`);
  }
  if (hooks.length === 0) hooks.push('紫微斗数 · 十四主星与四化');

  ctx.textAlign = 'center';
  ctx.fillStyle = cinnabar;
  ctx.font = `600 24px ${KAI}`;
  ctx.fillText(hooks[0], W / 2, hookY);
  if (hooks[1]) {
    ctx.fillStyle = ink;
    ctx.font = `18px ${KAI}`;
    ctx.fillText(hooks[1], W / 2, hookY + 32);
  }

  // 品牌与免责
  ctx.fillStyle = inkLight;
  ctx.font = `13px ${SANS}`;
  ctx.fillText('紫微鉴 · 数据只在本机处理', W / 2, H - 58);
  ctx.font = `12px ${SANS}`;
  ctx.fillText('本工具仅供传统文化研究，不构成任何专业建议', W / 2, H - 36);
  ctx.fillText('分享图不含姓名与出生日期', W / 2, H - 18);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `紫微斗数命盘_${chart.solarDate}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
