/** 主要城市经度（东经为正），用于真太阳时校正 */
export interface City {
  name: string;
  province: string;
  longitude: number;
}

export const CITIES: City[] = [
  { name: '北京', province: '北京', longitude: 116.41 },
  { name: '上海', province: '上海', longitude: 121.47 },
  { name: '天津', province: '天津', longitude: 117.2 },
  { name: '重庆', province: '重庆', longitude: 106.55 },
  { name: '香港', province: '香港', longitude: 114.17 },
  { name: '澳门', province: '澳门', longitude: 113.55 },
  { name: '台北', province: '台湾', longitude: 121.56 },
  { name: '广州', province: '广东', longitude: 113.26 },
  { name: '深圳', province: '广东', longitude: 114.06 },
  { name: '成都', province: '四川', longitude: 104.07 },
  { name: '杭州', province: '浙江', longitude: 120.15 },
  { name: '南京', province: '江苏', longitude: 118.78 },
  { name: '武汉', province: '湖北', longitude: 114.31 },
  { name: '西安', province: '陕西', longitude: 108.94 },
  { name: '郑州', province: '河南', longitude: 113.63 },
  { name: '济南', province: '山东', longitude: 117.0 },
  { name: '青岛', province: '山东', longitude: 120.38 },
  { name: '沈阳', province: '辽宁', longitude: 123.43 },
  { name: '大连', province: '辽宁', longitude: 121.62 },
  { name: '长春', province: '吉林', longitude: 125.32 },
  { name: '哈尔滨', province: '黑龙江', longitude: 126.53 },
  { name: '石家庄', province: '河北', longitude: 114.51 },
  { name: '太原', province: '山西', longitude: 112.55 },
  { name: '呼和浩特', province: '内蒙古', longitude: 111.75 },
  { name: '长沙', province: '湖南', longitude: 112.94 },
  { name: '南昌', province: '江西', longitude: 115.89 },
  { name: '合肥', province: '安徽', longitude: 117.28 },
  { name: '福州', province: '福建', longitude: 119.3 },
  { name: '厦门', province: '福建', longitude: 118.09 },
  { name: '昆明', province: '云南', longitude: 102.71 },
  { name: '贵阳', province: '贵州', longitude: 106.63 },
  { name: '南宁', province: '广西', longitude: 108.37 },
  { name: '海口', province: '海南', longitude: 110.2 },
  { name: '兰州', province: '甘肃', longitude: 103.83 },
  { name: '西宁', province: '青海', longitude: 101.78 },
  { name: '银川', province: '宁夏', longitude: 106.23 },
  { name: '乌鲁木齐', province: '新疆', longitude: 87.62 },
  { name: '喀什', province: '新疆', longitude: 75.99 },
  { name: '拉萨', province: '西藏', longitude: 91.11 },
  { name: '苏州', province: '江苏', longitude: 120.62 },
  { name: '宁波', province: '浙江', longitude: 121.55 },
  { name: '温州', province: '浙江', longitude: 120.7 },
  { name: '东莞', province: '广东', longitude: 113.75 },
  { name: '佛山', province: '广东', longitude: 113.12 },
  { name: '洛阳', province: '河南', longitude: 112.45 },
  { name: '无锡', province: '江苏', longitude: 120.3 },
  { name: '烟台', province: '山东', longitude: 121.39 },
];

export const DEFAULT_CITY = CITIES[0];

export function findCity(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

/** 常用城市：置顶，便于快速选择 */
export const COMMON_CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '成都',
  '杭州',
  '武汉',
  '西安',
  '南京',
  '重庆',
];

/** 按省份分组：避免长列表平铺，配合 select 的 optgroup 使用 */
export const CITY_GROUPS: { province: string; cities: City[] }[] = (() => {
  const map = new Map<string, City[]>();
  for (const c of CITIES) {
    const list = map.get(c.province);
    if (list) list.push(c);
    else map.set(c.province, [c]);
  }
  return [...map.entries()].map(([province, cities]) => ({ province, cities }));
})();
