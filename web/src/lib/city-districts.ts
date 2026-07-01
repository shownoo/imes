/** 地级市 → 行政区列表（与出库目的地种子数据一致） */
export const CITY_DISTRICTS: Record<string, readonly string[]> = {
  武汉市: [
    '江岸区',
    '江汉区',
    '硚口区',
    '汉阳区',
    '武昌区',
    '青山区',
    '洪山区',
    '东西湖区',
    '汉南区',
    '蔡甸区',
    '江夏区',
    '黄陂区',
    '新洲区',
  ],
}

export function getDistrictsForCity(city: string): string[] {
  return [...(CITY_DISTRICTS[city.trim()] ?? [])]
}
