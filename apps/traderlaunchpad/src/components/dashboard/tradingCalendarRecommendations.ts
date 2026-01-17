"use client";

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const isWeekday = (date: Date) => {
  const d = date.getDay();
  return d !== 0 && d !== 6;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export interface TradingCalendarDailyStat {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
}

interface RecommendationResult {
  goodWeekdays: number[]; // 0-6
  badWeekdays: number[]; // 0-6
  goodDayOfMonth: number[]; // 1-31
  badDayOfMonth: number[]; // 1-31
  goodDateKeys: Set<string>;
  badDateKeys: Set<string>;
}

export const getTradingCalendarRecommendations = ({
  dailyStats,
  fromDate = new Date(),
  daysAhead = 21,
  topWeekdayCount = 2,
  topDayOfMonthCount = 3,
  bottomWeekdayCount = 2,
  bottomDayOfMonthCount = 2,
  minSamplesWeekday = 1,
  minSamplesDayOfMonth = 1,
}: {
  dailyStats: TradingCalendarDailyStat[];
  fromDate?: Date;
  daysAhead?: number;
  topWeekdayCount?: number;
  topDayOfMonthCount?: number;
  bottomWeekdayCount?: number;
  bottomDayOfMonthCount?: number;
  minSamplesWeekday?: number;
  minSamplesDayOfMonth?: number;
}): RecommendationResult => {
  const weekdayAgg: Record<number, { sum: number; count: number }> = {};
  const domAgg: Record<number, { sum: number; count: number }> = {};

  for (const stat of dailyStats) {
    const [y, m, d] = stat.date.split("-").map((x) => Number(x));
    if (!y || !m || !d) continue;
    const date = new Date(y, m - 1, d);

    const weekday = date.getDay();
    weekdayAgg[weekday] ??= { sum: 0, count: 0 };
    weekdayAgg[weekday].sum += stat.pnl;
    weekdayAgg[weekday].count += 1;

    domAgg[d] ??= { sum: 0, count: 0 };
    domAgg[d].sum += stat.pnl;
    domAgg[d].count += 1;
  }

  const weekdayScores = Object.entries(weekdayAgg)
    .map(([k, v]) => ({
      weekday: Number(k),
      avg: v.sum / Math.max(1, v.count),
      count: v.count,
    }))
    .filter((x) => Number.isFinite(x.avg) && x.count >= minSamplesWeekday)
    .sort((a, b) => b.avg - a.avg);

  const domScores = Object.entries(domAgg)
    .map(([k, v]) => ({
      dom: Number(k),
      avg: v.sum / Math.max(1, v.count),
      count: v.count,
    }))
    .filter((x) => Number.isFinite(x.avg) && x.count >= minSamplesDayOfMonth)
    .sort((a, b) => b.avg - a.avg);

  const goodWeekdays = weekdayScores
    .slice(0, clamp(topWeekdayCount, 0, 4))
    .filter((x) => x.avg > 0)
    .map((x) => x.weekday);

  const badWeekdays = weekdayScores
    .slice()
    .reverse()
    .slice(0, clamp(bottomWeekdayCount, 0, 4))
    .filter((x) => x.avg < 0)
    .map((x) => x.weekday);

  const goodDayOfMonth = domScores
    .slice(0, clamp(topDayOfMonthCount, 0, 7))
    .filter((x) => x.avg > 0)
    .map((x) => x.dom);

  const badDayOfMonth = domScores
    .slice()
    .reverse()
    .slice(0, clamp(bottomDayOfMonthCount, 0, 7))
    .filter((x) => x.avg < 0)
    .map((x) => x.dom);

  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const goodDateKeys = new Set<string>();
  const badDateKeys = new Set<string>();

  for (let i = 1; i <= clamp(daysAhead, 1, 60); i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    if (!isWeekday(d)) continue;
    const weekday = d.getDay();
    const dom = d.getDate();
    const key = toDateKey(d);

    const isGood =
      goodWeekdays.includes(weekday) || goodDayOfMonth.includes(dom);
    const isBad = badWeekdays.includes(weekday) || badDayOfMonth.includes(dom);

    if (isGood) goodDateKeys.add(key);
    else if (isBad) badDateKeys.add(key);
  }

  return {
    goodWeekdays,
    badWeekdays,
    goodDayOfMonth,
    badDayOfMonth,
    goodDateKeys,
    badDateKeys,
  };
};

export const weekdayLabel = (weekday: number) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday] ?? "";
