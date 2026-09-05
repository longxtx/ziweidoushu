import type { Brightness, StrengthState } from './types';

/**
 * 斗数七级亮度 → 旺衰五态（PRD 6.2.4）
 * 统一复用同一套标签配色，避免两套体系并存。
 */
export function brightnessState(b?: Brightness): StrengthState | undefined {
  switch (b) {
    case '庙':
    case '旺':
      return '旺';
    case '得':
    case '利':
      return '相';
    case '平':
      return '休';
    case '不':
      return '囚';
    case '陷':
      return '衰';
    default:
      return undefined;
  }
}

/** 旺衰五态对应的 CSS 变量前缀，如 wang / xiang */
export function stateToken(state: StrengthState): string {
  const map: Record<StrengthState, string> = {
    旺: 'wang',
    相: 'xiang',
    休: 'xiu',
    囚: 'qiu',
    衰: 'shuai',
  };
  return map[state];
}
