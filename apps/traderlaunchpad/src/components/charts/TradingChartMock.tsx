"use client";

import React from "react";
import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

type Marker = {
  time: number; // ms or seconds
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape:
    | "circle"
    | "square"
    | "arrowUp"
    | "arrowDown"
    | "arrowLeft"
    | "arrowRight";
  text?: string;
};

type Props = {
  symbol?: string;
  height?: number;
  className?: string;
  markers?: Marker[];
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const seedFromString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const toUtcSeconds = (time: number): UTCTimestamp => {
  const sec = time > 10_000_000_000 ? Math.floor(time / 1000) : Math.floor(time);
  return sec as UTCTimestamp;
};

const generateCandles = (seed: number, count: number) => {
  const rand = mulberry32(seed);
  const nowSec = Math.floor(Date.now() / 1000);
  const interval = 60 * 15; // 15m
  const start = nowSec - interval * count;

  let price = 100 + rand() * 50;
  const data: Array<{
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const t = (start + i * interval) as UTCTimestamp;
    const drift = (rand() - 0.5) * 1.2;
    const vol = 0.2 + rand() * 1.8;
    const open = price;
    const close = open + drift;
    const high = Math.max(open, close) + rand() * vol;
    const low = Math.min(open, close) - rand() * vol;
    price = close;
    data.push({
      time: t,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
    });
  }

  return data;
};

export const TradingChartMock = (props: Props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);

  const symbol = (props.symbol ?? "MARKET").trim() || "MARKET";
  const height = clamp(props.height ?? 360, 220, 720);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Avoid double-init in strict mode / fast refresh
    if (chartRef.current) return;

    const dark = document.documentElement.classList.contains("dark");
    const background = dark ? "#0A0A0A" : "#FFFFFF";
    const textColor = dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.72)";
    const gridColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

    const chart = createChart(el, {
      height,
      width: el.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: background },
        textColor,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        rightOffset: 2,
        fixLeftEdge: true,
      },
      crosshair: { mode: CrosshairMode.Magnet },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#10B981",
      downColor: "#EF4444",
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "rgba(16,185,129,0.9)",
      wickDownColor: "rgba(239,68,68,0.9)",
    });

    const candles = generateCandles(seedFromString(symbol), 160);
    series.setData(candles);

    // Default markers + any passed markers
    const defaultMarkers = [
      {
        time: candles[Math.floor(candles.length * 0.35)]?.time ?? candles[0]!.time,
        position: "belowBar" as const,
        color: "#3B82F6",
        shape: "arrowUp" as const,
        text: "Entry",
      },
      {
        time: candles[Math.floor(candles.length * 0.75)]?.time ?? candles[candles.length - 1]!.time,
        position: "aboveBar" as const,
        color: "#22C55E",
        shape: "arrowDown" as const,
        text: "Exit",
      },
    ];

    const userMarkers = Array.isArray(props.markers)
      ? props.markers
          .map((m) => ({
            time: toUtcSeconds(m.time),
            position: m.position,
            color: m.color,
            shape: m.shape,
            text: m.text,
          }))
          .filter((m) => Boolean(m.time))
      : [];

    series.setMarkers([...defaultMarkers, ...userMarkers]);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      const nextWidth = el.clientWidth;
      chart.applyOptions({ width: nextWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, props.markers, symbol]);

  return (
    <div className={props.className}>
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg" />
    </div>
  );
};

