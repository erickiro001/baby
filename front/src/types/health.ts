// 健康记录相关类型

export interface HealthRecord {
  id: string;
  babyId: string;
  date: string;        // ISO date
  weight?: number;     // kg
  height?: number;     // cm
  headCircumference?: number; // cm
  note?: string;
  createdAt: string;
}

// WHO 生长标准数据点 (0-24个月女婴)
export interface WHODataPoint {
  month: number;
  sd3neg: number;  // -3 SD
  sd2neg: number;  // -2 SD
  sd1neg: number;  // -1 SD
  median: number;  // 0 SD (50th percentile)
  sd1: number;     // +1 SD
  sd2: number;     // +2 SD
  sd3: number;     // +3 SD
}

// WHO 数据集类型
export type WHOChartType = 'weight-age' | 'height-age' | 'weight-height' | 'head-age';

export interface WHODataSet {
  type: WHOChartType;
  gender: 'boy' | 'girl';
  label: string;
  unit: string;
  data: WHODataPoint[];
}
