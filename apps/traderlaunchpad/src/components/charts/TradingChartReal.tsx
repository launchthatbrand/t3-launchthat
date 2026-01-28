"use client";

import React from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createSeriesMarkers,
  createChart,
  type IChartApi,
  type IRange,
  type ISeriesApi,
  type Time,
  type SeriesMarker,
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

export type CrosshairOHLC = {
  kind: "crosshair" | "last";
  t: number; // ms
  o: number;
  h: number;
  l: number;
  c: number;
};

type Props = {
  bars: RealBar[];
  height?: number;
  className?: string;
  datasetKey?: string;
  showVolume?: boolean;
  onCrosshairOHLCChange?: (ohlc: unknown) => void;
  markers?: SeriesMarker<Time>[];
  priceLines?: {
    price: number;
    color: string;
    lineWidth?: number;
    title?: string;
  }[];
  hasMoreHistory?: boolean;
  isRequestingMoreHistory?: boolean;
  onRequestMoreHistory?: () => void;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const toUtcSeconds = (timeMs: number): UTCTimestamp =>
  Math.floor(timeMs / 1000) as UTCTimestamp;

export const TradingChartReal = (props: Props) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const seriesMarkersRef = React.useRef<ReturnType<typeof createSeriesMarkers> | null>(
    null,
  );
  const priceLinesRef = React.useRef<
    ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]
  >([]);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const onCrosshairOHLCChangeRef = React.useRef<Props["onCrosshairOHLCChange"]>(undefined);
  const onRequestMoreHistoryRef = React.useRef<Props["onRequestMoreHistory"]>(undefined);
  const hasMoreHistoryRef = React.useRef<boolean>(false);
  const isRequestingMoreHistoryRef = React.useRef<boolean>(false);
  const lastVisibleRangeRef = React.useRef<
    IRange<Time> | null
  >(null);
  const hasEverFitRef = React.useRef(false);
  const lastDatasetKeyRef = React.useRef<string | null>(null);
  const lastBarRef = React.useRef<RealBar | null>(null);
  const earliestTimeSecRef = React.useRef<number | null>(null);
  const barIntervalSecRef = React.useRef<number>(60);
  const lastAutoRequestAtMsRef = React.useRef<number>(0);

  React.useEffect(() => {
    onCrosshairOHLCChangeRef.current = props.onCrosshairOHLCChange;
  }, [props.onCrosshairOHLCChange]);

  React.useEffect(() => {
    onRequestMoreHistoryRef.current = props.onRequestMoreHistory;
    hasMoreHistoryRef.current = props.hasMoreHistory === true;
    isRequestingMoreHistoryRef.current = props.isRequestingMoreHistory === true;
  }, [props.hasMoreHistory, props.isRequestingMoreHistory, props.onRequestMoreHistory]);

  const fixedHeight =
    typeof props.height === "number" && Number.isFinite(props.height)
      ? clamp(props.height, 220, 2000)
      : undefined;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Avoid double-init in strict mode / fast refresh
    if (chartRef.current) return;

    const dark = document.documentElement.classList.contains("dark");
    const background = dark ? "#0A0A0A" : "#FFFFFF";
    const textColor = dark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.72)";
    const gridColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

    const initialHeight = clamp(fixedHeight ?? el.clientHeight ?? 360, 220, 2000);
    const chart = createChart(el, {
      height: initialHeight,
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

    // v5: unified series API
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "rgba(16,185,129,0.9)",
      wickDownColor: "rgba(239,68,68,0.9)",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      priceFormat: { type: "volume" },
      color: "rgba(148,163,184,0.5)",
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Reserve bottom ~20% of the pane for volume.
    series.priceScale().applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.22 },
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    // Track zoom/pan so we can preserve it across data swaps (timeframe changes).
    const handleVisibleRangeChange = (range: IRange<Time> | null) => {
      if (!range) return;
      lastVisibleRangeRef.current = range;

      const onRequest = onRequestMoreHistoryRef.current;
      if (!onRequest) return;
      if (!hasMoreHistoryRef.current) return;
      if (isRequestingMoreHistoryRef.current) return;

      const earliest = earliestTimeSecRef.current;
      if (typeof earliest !== "number") return;
      if (typeof range.from !== "number") return;

      const intervalSec = Math.max(1, barIntervalSecRef.current);
      const thresholdSec = intervalSec * 80;
      if (range.from > earliest + thresholdSec) return;

      const now = Date.now();
      if (now - lastAutoRequestAtMsRef.current < 1500) return;
      lastAutoRequestAtMsRef.current = now;
      onRequest();
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    const handleCrosshairMove = (param: {
      time?: UTCTimestamp;
      seriesData: Map<ISeriesApi<"Candlestick">, unknown>;
    }) => {
      const cb = onCrosshairOHLCChangeRef.current;
      if (!cb) return;

      const tSec = typeof param.time === "number" ? param.time : null;
      if (!tSec) {
        const last = lastBarRef.current;
        if (!last) return;
        cb({
          kind: "last",
          t: last.t,
          o: last.o,
          h: last.h,
          l: last.l,
          c: last.c,
        });
        return;
      }

      const row = param.seriesData.get(series) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      if (!row) return;
      cb({
        kind: "crosshair",
        t: (tSec as number) * 1000,
        o: Number(row.open),
        h: Number(row.high),
        l: Number(row.low),
        c: Number(row.close),
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove as any);

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;
    seriesMarkersRef.current = createSeriesMarkers(series, []);

    const ro = new ResizeObserver(() => {
      const nextWidth = el.clientWidth;
      const nextHeight = clamp(fixedHeight ?? el.clientHeight ?? 360, 220, 2000);
      chart.applyOptions({ width: nextWidth, height: nextHeight });
    });
    ro.observe(el);
    resizeObserverRef.current = ro;

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      chart.unsubscribeCrosshairMove(handleCrosshairMove as any);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      seriesMarkersRef.current = null;
      priceLinesRef.current = [];
    };
  }, [fixedHeight]);

  React.useEffect(() => {
    if (typeof fixedHeight !== "number") return;
    chartRef.current?.applyOptions({ height: fixedHeight });
  }, [fixedHeight]);

  React.useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !series) return;

    const datasetKey = typeof props.datasetKey === "string" ? props.datasetKey : "default";
    const didDatasetChange = lastDatasetKeyRef.current !== datasetKey;
    lastDatasetKeyRef.current = datasetKey;

    const bars = Array.isArray(props.bars) ? props.bars : [];
    const data = bars
      .filter((b) => Number.isFinite(b.t))
      .map((b) => ({
        time: toUtcSeconds(b.t),
        open: Number(b.o),
        high: Number(b.h),
        low: Number(b.l),
        close: Number(b.c),
      }));

    series.setData(data);
    lastBarRef.current = bars.length > 0 ? bars[bars.length - 1] ?? null : null;
    const firstBar = bars.length > 0 ? bars[0] : null;
    const secondBar = bars.length > 1 ? bars[1] : null;
    earliestTimeSecRef.current = firstBar ? Math.floor(firstBar.t / 1000) : null;
    if (firstBar && secondBar) {
      barIntervalSecRef.current = Math.max(1, Math.floor((secondBar.t - firstBar.t) / 1000));
    }

    if (volumeSeries) {
      if (props.showVolume === false) {
        volumeSeries.setData([]);
      } else {
        const volumeData = bars
          .filter((b) => Number.isFinite(b.t))
          .map((b) => ({
            time: toUtcSeconds(b.t),
            value: Number.isFinite(b.v) ? Number(b.v) : 0,
            color: b.c >= b.o ? "rgba(16,185,129,0.55)" : "rgba(239,68,68,0.55)",
          }));
        volumeSeries.setData(volumeData);
      }
    }

    // Markers (trade markers / signals).
    if (seriesMarkersRef.current) {
      seriesMarkersRef.current.setMarkers(Array.isArray(props.markers) ? props.markers : []);
    }

    // Price lines (SL/TP).
    for (const line of priceLinesRef.current) {
      try {
        series.removePriceLine(line);
      } catch {
        // ignore
      }
    }
    priceLinesRef.current = [];
    if (Array.isArray(props.priceLines)) {
      for (const pl of props.priceLines) {
        if (!pl || !Number.isFinite(pl.price)) continue;
        const line = series.createPriceLine({
          price: pl.price,
          color: pl.color,
          lineWidth: pl.lineWidth ?? 1,
          title: pl.title,
        });
        priceLinesRef.current.push(line);
      }
    }
    // Only restore/focus the view when the dataset changes (timeframe/feed/symbol),
    // NOT when we simply prepend older candles for infinite scroll.
    if (didDatasetChange) {
      const last = lastVisibleRangeRef.current;
      if (last) {
        try {
          chart.timeScale().setVisibleRange(last);
        } catch {
          chart.timeScale().fitContent();
          hasEverFitRef.current = true;
        }
      } else if (!hasEverFitRef.current) {
        chart.timeScale().fitContent();
        hasEverFitRef.current = true;
      }
    } else if (!hasEverFitRef.current) {
      chart.timeScale().fitContent();
      hasEverFitRef.current = true;
    }
  }, [props.bars, props.datasetKey, props.markers, props.priceLines, props.showVolume]);

  return (
    <div
      ref={containerRef}
      className={props.className ?? "w-full"}
      aria-label="Price chart"
    />
  );
};

