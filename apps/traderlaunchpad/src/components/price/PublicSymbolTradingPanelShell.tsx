"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PublicSymbolTradingPanel } from "~/components/price/PublicSymbolTradingPanel";

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

export function PublicSymbolTradingPanelShell({
  className,
}: {
  className?: string;
}) {
  const params = useParams<{ symbol?: string }>();
  const raw = typeof params?.symbol === "string" ? params.symbol : "";
  const decoded = raw ? decodeURIComponent(raw) : "";
  const canonical = normalizeSymbol(decoded || "BTCUSD");

  return <PublicSymbolTradingPanel symbol={canonical} className={className} />;
}

