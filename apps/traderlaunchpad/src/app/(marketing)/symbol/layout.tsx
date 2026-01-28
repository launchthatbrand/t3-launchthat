import React from "react";
import { PublicSymbolTradingPanelShell } from "../../../components/price/PublicSymbolTradingPanelShell";

export default function SymbolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen">
      <PublicSymbolTradingPanelShell className="h-screen" />
      {children}
    </div>
  );
}

