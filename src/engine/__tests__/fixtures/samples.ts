import type { SolarBirthInput } from '../../types';

/**
 * 黄金样本集（PRD 5.3）
 *
 * 采用确定性生成而非随机，保证可复现、可 diff。
 * 当前 200 例，覆盖：年份跨度 1900–2100、12 个月份、12 时辰、男女各半、
 * 真太阳时开闭、早晚子时、跨经度（含新疆/西藏等极端经度）。
 */
export function generateSamples(): SolarBirthInput[] {
  const samples: SolarBirthInput[] = [];
  // 覆盖不同经度：北京、上海、乌鲁木齐、喀什、拉萨、香港
  const longitudes = [116.41, 121.47, 87.62, 75.99, 91.11, 114.17];

  for (let i = 0; i < 200; i++) {
    const year = 1900 + ((i * 7) % 201); // 打散覆盖 1900–2100
    const month = (i % 12) + 1;
    const day = ((i * 5) % 28) + 1;
    const timeIndex = i % 12;
    const isEarlyZi = i % 3 === 0;
    const gender = i % 2 === 0 ? 'male' : 'female';
    const useTrueSolarTime = i % 2 === 1; // 一半开启真太阳时
    const longitude = longitudes[i % longitudes.length];

    samples.push({
      calendar: 'solar',
      solarDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      timeIndex,
      isEarlyZi,
      gender,
      timezoneOffset: 8,
      longitude,
      useTrueSolarTime,
      ziStrategy: i % 4 === 0 ? 'late-zi-same-day' : 'late-zi-next-day',
    });
  }

  return samples;
}
