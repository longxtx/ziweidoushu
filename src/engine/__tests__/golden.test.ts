import { describe, expect, it } from 'vitest';

import { astrolabeByBirth, MIN_YEAR, MAX_YEAR } from '../index';
import { generateSamples } from './fixtures/samples';

/**
 * 回归测试（PRD 9.9）
 *
 * 这里断言的是「盘面不变量」而非硬编码快照——不变量能立即发现任何规则的回归，
 * 且不会因内核替换（V1.0 自研引擎）而需要重写。
 */
describe('黄金样本集：盘面不变量', () => {
  const samples = generateSamples();

  it('样本集规模与覆盖度符合 PRD 5.3', () => {
    expect(samples).toHaveLength(200);
    const years = new Set(samples.map((s) => s.solarDate.slice(0, 4)));
    expect(years.size).toBeGreaterThan(50); // 年份跨度充分
    expect(samples.filter((s) => s.gender === 'male')).toHaveLength(100);
    expect(samples.filter((s) => s.useTrueSolarTime)).toHaveLength(100);
  });

  it('全部样本均可排盘，且满足盘面不变量', () => {
    const failures: string[] = [];

    for (const input of samples) {
      const label = `${input.solarDate} ${input.timeIndex}时 ${input.gender} ${
        input.useTrueSolarTime ? 'TST' : 'raw'
      }`;
      const result = astrolabeByBirth(input);

      if (!result.ok) {
        failures.push(`${label} 排盘失败：${result.error.code} ${result.error.message}`);
        continue;
      }

      const chart = result.value;

      // 1. 十二宫齐全
      if (chart.palaces.length !== 12) {
        failures.push(`${label} 宫位数为 ${chart.palaces.length}`);
        continue;
      }

      // 2. 十四主星各出现一次
      const majorNames = chart.palaces.flatMap((p) => p.majorStars.map((s) => s.name));
      const uniqueMajor = new Set(majorNames);
      if (majorNames.length !== 14 || uniqueMajor.size !== 14) {
        failures.push(`${label} 主星数 ${majorNames.length}（唯一 ${uniqueMajor.size}）`);
      }

      // 3. 每宫干支非空
      for (const p of chart.palaces) {
        if (!p.heavenlyStem || !p.earthlyBranch) {
          failures.push(`${label} 宫位「${p.name}」干支缺失`);
        }
      }

      // 4. 命宫 / 身宫索引有效
      if (chart.soulPalaceIndex < 0 || chart.soulPalaceIndex > 11) {
        failures.push(`${label} 命宫索引异常 ${chart.soulPalaceIndex}`);
      }
      if (chart.bodyPalaceIndex < 0 || chart.bodyPalaceIndex > 11) {
        failures.push(`${label} 身宫索引异常 ${chart.bodyPalaceIndex}`);
      }
      if (chart.palaces[chart.soulPalaceIndex]?.name !== '命宫') {
        failures.push(`${label} 命宫索引与宫位名不一致`);
      }

      // 5. 十二地支各出现一次（宫位按顺序排列）
      const branches = new Set(chart.palaces.map((p) => p.earthlyBranch));
      if (branches.size !== 12) {
        failures.push(`${label} 地支重复或缺失（唯一 ${branches.size}）`);
      }

      // 6. 大限区间：从起运年龄开始，连续十段各十年，无重叠无空隙
      const ranges = chart.palaces
        .map((p) => p.daXian.range)
        .sort((a, b) => a[0] - b[0]);
      const start = ranges[0][0];
      // 五行局决定起运年龄：水二局 2 岁起，火六局 6 岁起
      if (start < 2 || start > 6) {
        failures.push(`${label} 起运年龄异常 ${start}`);
      }
      for (let i = 0; i < ranges.length; i++) {
        const expectStart = start + i * 10;
        const expectEnd = expectStart + 9;
        if (ranges[i][0] !== expectStart || ranges[i][1] !== expectEnd) {
          failures.push(
            `${label} 大限第 ${i + 1} 段为 [${ranges[i][0]},${ranges[i][1]}]，期望 [${expectStart},${expectEnd}]`,
          );
          break;
        }
      }

      // 7. 五行局命名合法
      if (!/^[水木金土火][二三四五六]局$/.test(chart.fiveElementsClass)) {
        failures.push(`${label} 五行局异常 ${chart.fiveElementsClass}`);
      }

      // 8. 真太阳时开启时必须给出校正结果
      if (input.useTrueSolarTime && !chart.correction) {
        failures.push(`${label} 开启真太阳时但缺少校正结果`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('极端经度会触发时辰或日期变更（真太阳时确实生效）', () => {
    let changed = 0;
    for (const input of samples) {
      if (!input.useTrueSolarTime) continue;
      const result = astrolabeByBirth(input);
      if (!result.ok) continue;
      const c = result.value.correction;
      if (c && (c.changedHour || c.crossedDay)) changed++;
    }
    // 样本含乌鲁木齐（87.6°）与喀什（76°），必有相当比例的时辰修正
    expect(changed).toBeGreaterThan(10);
  });

  it('历法边界年份在支持范围内', () => {
    const base = generateSamples()[0];
    const first = astrolabeByBirth({ ...base, solarDate: `${MIN_YEAR}-03-01` });
    const last = astrolabeByBirth({ ...base, solarDate: `${MAX_YEAR}-10-01` });
    expect(first.ok).toBe(true);
    expect(last.ok).toBe(true);
  });
});
