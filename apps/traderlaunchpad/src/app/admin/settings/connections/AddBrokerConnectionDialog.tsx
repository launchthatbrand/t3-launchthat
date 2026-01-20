"use client";

import React from "react";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";
import { cn } from "~/lib/utils";
import { TradeLockerConnectFlow } from "~/components/settings/tradelocker/TradeLockerConnectFlow";

type ProviderKey = "tradelocker" | "mt4" | "mt5" | "binance";

type ProviderOption = {
  key: ProviderKey;
  label: string;
  description: string;
  enabled: boolean;
};

const providers: Array<ProviderOption> = [
  {
    key: "tradelocker",
    label: "TradeLocker",
    description: "Connect your TradeLocker broker account for syncing.",
    enabled: true,
  },
  {
    key: "mt4",
    label: "MetaTrader 4",
    description: "Connect via EA or Signal Start.",
    enabled: false,
  },
  {
    key: "mt5",
    label: "MetaTrader 5",
    description: "Connect via EA or Signal Start.",
    enabled: false,
  },
  {
    key: "binance",
    label: "Binance",
    description: "Connect your Binance account for trade & market data.",
    enabled: false,
  },
];

export function AddBrokerConnectionDialog(props: {
  initialProvider?: ProviderKey;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<ProviderKey | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) {
      setSelectedProvider(null);
    } else if (props.initialProvider) {
      setSelectedProvider(props.initialProvider);
    }
  }, [open, props.initialProvider]);

  const handleSelect = (key: ProviderKey) => {
    setSelectedProvider(key);
  };

  return (
    <>
      <Button
        type="button"
        className={cn(
          "h-9 bg-orange-600 text-white hover:bg-orange-700",
          props.triggerClassName,
        )}
        onClick={() => setOpen(true)}
      >
        Add connection
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          {selectedProvider === null ? (
            <>
              <DialogHeader>
                <DialogTitle>Add broker connection</DialogTitle>
                <DialogDescription>
                  Choose which provider you want to connect.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                {providers.map((p) => {
                  const card = (
                    <button
                      type="button"
                      onClick={() => handleSelect(p.key)}
                      disabled={!p.enabled}
                      className={cn(
                        "flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition",
                        "border-white/10 bg-black/20 hover:bg-black/30",
                        p.enabled
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60 hover:bg-black/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white/90">
                          {p.label}
                        </div>
                        {!p.enabled ? (
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                            Coming soon
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-white/60">{p.description}</div>
                    </button>
                  );

                  if (p.enabled) return <React.Fragment key={p.key}>{card}</React.Fragment>;

                  return (
                    <Tooltip key={p.key}>
                      <TooltipTrigger asChild>{card}</TooltipTrigger>
                      <TooltipContent side="bottom" align="start">
                        Coming soon
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="text-xs text-white/50">
                Only TradeLocker is available right now.
              </div>
            </>
          ) : selectedProvider === "tradelocker" ? (
            <>
              <DialogHeader>
                <DialogTitle>Connect TradeLocker</DialogTitle>
                <DialogDescription>
                  Enter your TradeLocker credentials to fetch accounts, then select one to connect.
                </DialogDescription>
              </DialogHeader>

              <TradeLockerConnectFlow
                onCancel={() => setSelectedProvider(null)}
                onSuccess={() => {
                  setOpen(false);
                }}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Coming soon</DialogTitle>
                <DialogDescription>
                  This provider isn’t available yet.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedProvider(null)}>
                  Back
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

