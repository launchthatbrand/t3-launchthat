"use client";

import Link from "next/link";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

export type TradeLockerAccountsListProps = {
  accounts: Array<any>;
  selectedAccNum?: number | null;
  onRefreshStatus?: (row: any) => void;
};

export function TradeLockerAccountsList(props: TradeLockerAccountsListProps) {
  const list = Array.isArray(props.accounts) ? props.accounts : [];

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/60">
        No accounts saved yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {list.map((row) => {
        const isActive =
          Number(row?.accNum ?? 0) === Number(props.selectedAccNum ?? 0);
        const id = String(row?._id ?? "");
        const href = `/admin/connections/${id}`;

        const acc = row?.customerAccess;
        const hasMarket =
          typeof acc?.symbolInfo === "boolean" ? Boolean(acc.symbolInfo) : null;

        return (
          <div
            key={id || `${row?.accountId ?? ""}:${row?.accNum ?? ""}`}
            className="rounded-xl border border-white/10 bg-black/30 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-semibold text-white/80">
                    {typeof row?.name === "string" && row.name.trim()
                      ? row.name
                      : `Account ${String(row?.accNum ?? "—")}`}
                  </div>
                  {isActive ? (
                    <Badge className="bg-blue-600/10 text-blue-200 hover:bg-blue-600/20">
                      Active
                    </Badge>
                  ) : null}
                  {hasMarket === true ? (
                    <Badge className="bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20">
                      Market OK
                    </Badge>
                  ) : hasMarket === false ? (
                    <Badge className="bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                      Blocked
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-white/5 text-white/60">
                      Unknown
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/55">
                  <span className="font-mono">accNum {String(row?.accNum ?? "—")}</span>
                  <span className="font-mono">id {String(row?.accountId ?? "—")}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild type="button" size="sm" variant="outline" className="h-8">
                  <Link href={href}>Open</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => props.onRefreshStatus?.(row)}
                >
                  Refresh status
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

