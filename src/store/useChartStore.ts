import { create } from 'zustand';

import type { BirthInput, Chart, EngineError } from '@/engine';

interface ChartState {
  input: BirthInput | null;
  chart: Chart | null;
  error: EngineError | null;
  /** 当前选中的宫位索引，null 表示未打开详情 */
  selectedPalace: number | null;
  loading: boolean;

  cast: (input: BirthInput) => Promise<void>;
  selectPalace: (index: number | null) => void;
  clear: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  input: null,
  chart: null,
  error: null,
  selectedPalace: null,
  loading: false,

  cast: async (input) => {
    set({ loading: true, error: null });
    // 引擎按需加载：首屏（表单）不引入，守住包体预算（PRD 9.7）
    const { astrolabeByBirth } = await import('@/engine');
    // 排盘为纯前端计算（< 50ms）
    const result = astrolabeByBirth(input);
    if (result.ok) {
      set({ input, chart: result.value, error: null, selectedPalace: null, loading: false });
    } else {
      set({ input, chart: null, error: result.error, selectedPalace: null, loading: false });
    }
  },

  selectPalace: (index) => set({ selectedPalace: index }),
  clear: () => set({ input: null, chart: null, error: null, selectedPalace: null }),
}));
