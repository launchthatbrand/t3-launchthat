import { AffiliatePageShell } from "../../../components/affiliates/AffiliatePageShell";
import { PublicSymbolsGrid } from "~/components/price/PublicSymbolsGrid";
import React from "react";

export default async function SymbolsArchivePage() {
  return (
    <AffiliatePageShell title="Symbols" subtitle="Cached real price data (default source)">
      <PublicSymbolsGrid />
    </AffiliatePageShell>
  );
}

