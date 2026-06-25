import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HealthRecord } from '@/types/health';
import { WHO_WEIGHT_AGE_GIRL, WHO_HEIGHT_AGE_GIRL, WHO_HEAD_AGE_GIRL } from '@/lib/whoData';

interface GrowthChartProps {
  records: HealthRecord[];
  babyBirthday: string;
  chartType: 'weight' | 'height' | 'head';
  /** Optional — accepted for compatibility, not used in this layout */
  currentAgeMonths?: number;
  /** 出生时的数值，展示为月龄 0 的数据点 */
  birthValue?: number;
}

// 从字符串中提取数值 (如 "3.2kg" → 3.2)
const parseNumeric = (val: string | undefined): number | undefined => {
  if (!val) return undefined;
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? undefined : num;
};

// Calculate age in months from birthday to record date
function getAgeInMonths(birthday: string, recordDate: string): number {
  const birth = new Date(birthday);
  const date = new Date(recordDate);
  return (date.getFullYear() - birth.getFullYear()) * 12 + (date.getMonth() - birth.getMonth());
}

const WHO_DATA_MAP = {
  weight: WHO_WEIGHT_AGE_GIRL,
  height: WHO_HEIGHT_AGE_GIRL,
  head: WHO_HEAD_AGE_GIRL,
};

const CHART_CONFIG = {
  weight: { label: '体重 (kg)', color: '#FF8A8A', whoUnit: 'kg' },
  height: { label: '身长 (cm)', color: '#A8D8EA', whoUnit: 'cm' },
  head: { label: '头围 (cm)', color: '#D4E5A8', whoUnit: 'cm' },
};

const GrowthChart: React.FC<GrowthChartProps> = ({ records, babyBirthday, chartType, birthValue }) => {
  const config = CHART_CONFIG[chartType];
  const whoData = WHO_DATA_MAP[chartType];

  // Transform baby records to chart data points
  const babyData = useMemo(() => {
    const data = records
      .map((r) => {
        const months = getAgeInMonths(babyBirthday, r.date);
        const value = chartType === 'weight' ? r.weight : chartType === 'height' ? r.height : r.headCircumference;
        return value !== undefined ? { month: months, value, date: r.date } : null;
      })
      .filter(Boolean);

    // 出生数据作为月龄 0 的数据点
    if (birthValue !== undefined && birthValue > 0) {
      data.push({ month: 0, value: birthValue, date: babyBirthday });
    }

    return data.sort((a, b) => (a?.month || 0) - (b?.month || 0));
  }, [records, babyBirthday, chartType, birthValue]);

  // Merge WHO data with baby data for the chart
  const chartData = useMemo(() => {
    // Create a map of WHO data by month
    const whoByMonth = new Map(whoData.map((d) => [d.month, d]));
    // Get all months we need (WHO + baby data)
    const allMonths = Array.from(new Set([...whoData.map((d) => d.month), ...babyData.map((d) => d?.month || 0)])).sort((a, b) => a - b);

    return allMonths.map((m) => {
      const who = whoByMonth.get(m);
      const baby = babyData.find((d) => d?.month === m);
      return {
        month: m,
        babyValue: baby?.value || null,
        sd3neg: who?.sd3neg || null,
        sd2neg: who?.sd2neg || null,
        sd1neg: who?.sd1neg || null,
        median: who?.median || null,
        sd1: who?.sd1 || null,
        sd2: who?.sd2 || null,
        sd3: who?.sd3 || null,
      };
    });
  }, [whoData, babyData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const month = data.month;
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }}>
        <p className="font-heading font-semibold mb-1" style={{ color: '#5C4033' }}>{month}个月</p>
        {data.babyValue !== null && (
          <p className="font-body font-semibold" style={{ color: config.color }}>
            宝宝: {data.babyValue}{config.whoUnit}
          </p>
        )}
        <p style={{ color: '#8B7355' }}>WHO中位数: {data.median}{config.whoUnit}</p>
      </div>
    );
  };

  return (
    <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }}>
      <h3 className="text-sm font-heading font-semibold mb-2" style={{ color: '#5C4033' }}>
        {chartType === 'weight' ? '体重-年龄' : chartType === 'height' ? '身长-年龄' : '头围-年龄'}
        <span className="text-[10px] font-normal ml-1" style={{ color: '#8B7355' }}>WHO标准对比</span>
      </h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,64,51,0.1)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={{ stroke: 'rgba(92,64,51,0.2)' }} label={{ value: '月龄', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#8B7355' } }} />
            <YAxis tick={{ fontSize: 10, fill: '#8B7355' }} tickLine={false} axisLine={{ stroke: 'rgba(92,64,51,0.2)' }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {/* WHO curves (lighter) */}
            <Line type="monotone" dataKey="sd3neg" stroke="#E8E0D8" strokeWidth={1} dot={false} name="-3SD" />
            <Line type="monotone" dataKey="sd2neg" stroke="#D4C8BC" strokeWidth={1} dot={false} strokeDasharray="4 2" name="-2SD" />
            <Line type="monotone" dataKey="sd1neg" stroke="#C4B8AC" strokeWidth={1} dot={false} name="-1SD" />
            <Line type="monotone" dataKey="median" stroke="#A09890" strokeWidth={1.5} dot={false} name="中位数" />
            <Line type="monotone" dataKey="sd1" stroke="#C4B8AC" strokeWidth={1} dot={false} name="+1SD" />
            <Line type="monotone" dataKey="sd2" stroke="#D4C8BC" strokeWidth={1} dot={false} strokeDasharray="4 2" name="+2SD" />
            <Line type="monotone" dataKey="sd3" stroke="#E8E0D8" strokeWidth={1} dot={false} name="+3SD" />
            {/* Baby data (prominent) */}
            <Line type="monotone" dataKey="babyValue" stroke={config.color} strokeWidth={3} dot={{ r: 5, fill: config.color, stroke: '#5C4033', strokeWidth: 1.5 }} activeDot={{ r: 7 }} name={config.label} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-3 mt-1">
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ backgroundColor: config.color }} /><span className="text-[10px] font-heading" style={{ color: '#5C4033' }}>宝宝</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#A09890' }} /><span className="text-[10px] font-heading" style={{ color: '#8B7355' }}>WHO中位数</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#D4C8BC' }} /><span className="text-[10px] font-heading" style={{ color: '#A09890' }}>±2SD</span></div>
      </div>
    </div>
  );
};

export default React.memo(GrowthChart);
