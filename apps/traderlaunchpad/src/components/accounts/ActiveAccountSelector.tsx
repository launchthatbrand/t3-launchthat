"use client";

import * as React from "react";

import { Badge } from "@acme/ui/badge";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { useActiveAccount } from "./ActiveAccountProvider";

export function ActiveAccountSelector(props: { className?: string }) {
  const account = useActiveAccount();

  if (!account.isLive) return null;
  if (account.options.length <= 1) return null;

  const selectedRowId = account.selected?.accountRowId ?? "";
  const selectedLabel = account.selected?.label ?? "Select account";

  return (
    <div className={props.className}>
      <div className="flex w-full items-center gap-2">
        <Label className="sr-only">Account</Label>
        <Select
          value={selectedRowId}
          onValueChange={(v) => void account.setSelectedAccountRowId(v)}
        >
        <SelectTrigger className="h-9 w-full min-w-0 border-border/60 bg-white/70 text-foreground hover:bg-white sm:w-auto sm:min-w-[220px] dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10">
            <SelectValue placeholder="Select account…">{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]">
            {account.options.map((o) => (
              <SelectItem key={o.accountRowId} value={o.accountRowId}>
                <div className="flex items-center gap-2">
                  <span className="truncate">{o.meta?.name ?? "Account"}</span>
                  {o.meta?.currency ? (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {o.meta.currency}
                    </Badge>
                  ) : null}
                  {o.meta?.status ? (
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      {o.meta.status}
                    </Badge>
                  ) : null}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

