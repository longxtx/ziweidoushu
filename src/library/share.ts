import type { BirthInput, Gender, ZiStrategy, School, YearDivide } from '@/engine';

/**
 * 分享链接：把排盘输入参数编码进 URL 的 `?share=` 查询串（Base64URL）。
 * 链接不含姓名与备注（PRD F5 隐私要求）。
 */

interface SharePayload {
  c: 's' | 'l';
  d: string | { y: number; m: number; day: number; l: 0 | 1 };
  t: number; // timeIndex
  e: 0 | 1; // isEarlyZi
  u: 0 | 1; // timeUnknown
  g: Gender;
  z: number; // timezoneOffset
  ln?: number; // longitude
  r: 0 | 1; // useTrueSolarTime
  s: ZiStrategy;
  sc?: School;
  y?: YearDivide;
}

function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeChart(input: BirthInput): string {
  const bit = (b: boolean): 0 | 1 => (b ? 1 : 0);
  const base = {
    t: input.timeIndex,
    e: bit(input.isEarlyZi),
    u: bit(!!input.timeUnknown),
    g: input.gender,
    z: input.timezoneOffset,
    ln: input.longitude,
    r: bit(input.useTrueSolarTime),
    s: input.ziStrategy,
    sc: input.school,
    y: input.yearDivide,
  };
  const payload: SharePayload =
    input.calendar === 'solar'
      ? { ...base, c: 's', d: input.solarDate }
      : {
          ...base,
          c: 'l',
          d: {
            y: input.lunarDate.year,
            m: input.lunarDate.month,
            day: input.lunarDate.day,
            l: input.lunarDate.isLeapMonth ? 1 : 0,
          },
        };
  return b64urlEncode(JSON.stringify(payload));
}

export function decodeChart(param: string): BirthInput | null {
  try {
    const obj = JSON.parse(b64urlDecode(param)) as SharePayload;
    if (obj.c !== 's' && obj.c !== 'l') return null;
    // 仅在字段存在时赋值，使往返结果与原始输入在 toEqual 下完全一致
    const base: Record<string, unknown> = {
      timeIndex: Number(obj.t) || 0,
      isEarlyZi: !!obj.e,
      gender: obj.g,
      timezoneOffset: Number(obj.z) || 8,
      useTrueSolarTime: !!obj.r,
      ziStrategy: obj.s ?? ('chineseZi' as ZiStrategy),
    };
    if (obj.u) base.timeUnknown = true;
    if (obj.ln !== undefined) base.longitude = obj.ln;
    if (obj.sc !== undefined) base.school = obj.sc;
    if (obj.y !== undefined) base.yearDivide = obj.y;

    if (obj.c === 's') {
      return { ...base, calendar: 'solar', solarDate: String(obj.d) } as BirthInput;
    }
    const d = obj.d as { y: number; m: number; day: number; l: 0 | 1 };
    return {
      ...base,
      calendar: 'lunar',
      lunarDate: { year: d.y, month: d.m, day: d.day, isLeapMonth: !!d.l },
    } as BirthInput;
  } catch {
    return null;
  }
}

/** 生成可分享的完整 URL（不含姓名/备注） */
export function buildShareUrl(input: BirthInput): string {
  const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${base}?share=${encodeChart(input)}`;
}
