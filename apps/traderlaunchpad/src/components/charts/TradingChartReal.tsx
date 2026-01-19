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

export type RealBar = {
  t: number; // ms
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

type Props = {
  bars: RealBar[];
  height?: number;
  className?: string;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const toUtcSeconds = (timeMs: number): UTCTimestamp =>
  Math.floor(timeMs / 1000) as UTCTimestamp;

export const TradingChartReal = (props: Props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

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

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      const nextWidth = el.clientWidth;
      chart.applyOptions({ width: nextWidth });
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  React.useEffect(() => {
    chartRef.current?.applyOptions({ height });
  }, [height]);

  React.useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const data = (Array.isArray(props.bars) ? props.bars : [])
      .filter((b) => Number.isFinite(b.t))
      .map((b) => ({
        time: toUtcSeconds(b.t),
        open: Number(b.o),
        high: Number(b.h),
        low: Number(b.l),
        close: Number(b.c),
      }));

    series.setData(data);
    chart.timeScale().fitContent();
  }, [props.bars]);

  return (
    <div
      ref={containerRef}
      className={props.className ?? "w-full"}
      aria-label="Price chart"
    />
  );
};

