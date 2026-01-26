"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@acme/ui/tooltip";

import { Button } from "@acme/ui/button";
import React from "react";
import { TradeLockerConnectFlow } from "~/components/settings/tradelocker/TradeLockerConnectFlow";
import { cn } from "~/lib/utils";

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
  const [direction, setDirection] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    if (!open) {
      setSelectedProvider(null);
    } else if (props.initialProvider) {
      setDirection(1);
      setSelectedProvider(props.initialProvider);
    }
  }, [open, props.initialProvider]);

  const handleSelect = (key: ProviderKey) => {
    setDirection(1);
    setSelectedProvider(key);
  };

  const handleBack = () => {
    setDirection(-1);
    setSelectedProvider(null);
  };

  const stepKey = selectedProvider ?? "choose";

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      x: dir === 1 ? 28 : -28,
      opacity: 0,
      filter: "blur(2px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (dir: 1 | -1) => ({
      x: dir === 1 ? -28 : 28,
      opacity: 0,
      filter: "blur(2px)",
    }),
  } as const;

  return (
    <>
      <Button
        type="button"
        className={cn(
          "h-9 bg-orange-600 text-foreground hover:bg-orange-700",
          props.triggerClassName,
        )}
        onClick={() => setOpen(true)}
      >
        Add connection
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                mass: 0.7,
              }}
              className="min-h-[360px]"
            >
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
                            "border-border/40 bg-card/50 hover:bg-card/70",
                            p.enabled
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-60 hover:bg-card/50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-foreground/90">
                              {p.label}
                            </div>
                            {!p.enabled ? (
                              <span className="rounded-md border border-border/40 bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                                Coming soon
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
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

                  <div className="text-xs text-muted-foreground">
                    Only TradeLocker is available right now.
                  </div>
                </>
              ) : selectedProvider === "tradelocker" ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  </div>

                  <DialogHeader>
                    <DialogTitle>Connect TradeLocker</DialogTitle>
                    <DialogDescription>
                      Enter your TradeLocker credentials to fetch accounts, then select one to connect.
                    </DialogDescription>
                  </DialogHeader>

                  <TradeLockerConnectFlow
                    onCancel={handleBack}
                    onSuccess={() => {
                      setOpen(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  </div>

                  <DialogHeader>
                    <DialogTitle>Coming soon</DialogTitle>
                    <DialogDescription>
                      This provider isn’t available yet.
                    </DialogDescription>
                  </DialogHeader>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

