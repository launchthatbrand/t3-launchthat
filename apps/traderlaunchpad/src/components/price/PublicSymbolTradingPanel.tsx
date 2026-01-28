"use client";

import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Badge } from "@acme/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { cn } from "@acme/ui/lib/utils";
import { PublicSymbolPricePanel } from "~/components/price/PublicSymbolPricePanel";

const watchlist = ["BTCUSD", "ETHUSD", "XAUUSD", "EURUSD", "GBPUSD"];

export function PublicSymbolTradingPanel({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <ResizablePanelGroup
        direction="vertical"
        className="h-[72vh] min-h-[640px] overflow-hidden rounded-3xl border border-white/10 bg-black/20"
      >
        <ResizablePanel defaultSize={72} minSize={45}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={74} minSize={55}>
              <div className="h-full p-3">
                <PublicSymbolPricePanel
                  symbol={symbol}
                  fillHeight
                  className="h-full min-h-0 rounded-2xl border-white/10 bg-white/3 p-4"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={26} minSize={18} maxSize={40}>
              <div className="h-full p-3">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="text-sm font-semibold text-white/85">
                      Panel
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Demo
                    </Badge>
                  </div>

                  <Tabs defaultValue="watchlist" className="flex h-full flex-col">
                    <div className="border-b border-white/10 px-3 py-2">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="watchlist">Watch</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="trade">Trade</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent
                      value="watchlist"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-2">
                        {watchlist.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white/80 hover:bg-black/30",
                              s === symbol ? "ring-1 ring-white/20" : "",
                            )}
                            // MVP: just visual; no navigation yet
                          >
                            <span className="font-mono">{s}</span>
                            {s === symbol ? (
                              <span className="text-xs text-white/50">
                                Viewing
                              </span>
                            ) : (
                              <span className="text-xs text-white/50">
                                Open
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="details"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Instrument
                          </div>
                          <div className="mt-1 font-mono text-sm text-white/80">
                            {symbol}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Status
                          </div>
                          <div className="mt-1 text-sm text-white/70">
                            Public ClickHouse cache (MVP)
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Notes
                          </div>
                          <div className="mt-1 text-sm text-white/60">
                            This sidebar becomes accounts, order ticket, DOM,
                            alerts, etc.
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="trade"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Order ticket (MVP)
                          </div>
                          <div className="mt-3 grid gap-3">
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Size
                              </Label>
                              <Input
                                defaultValue="0.01"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Stop loss
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Take profit
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="grid grid-cols-2 gap-2">
                              <Button className="h-9 bg-emerald-600 hover:bg-emerald-700">
                                Buy
                              </Button>
                              <Button className="h-9 bg-rose-600 hover:bg-rose-700">
                                Sell
                              </Button>
                            </div>
                            <div className="text-xs text-white/50">
                              MVP only — no broker execution yet.
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="h-full p-3">
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md">
              <Tabs defaultValue="positions" className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <TabsList className="grid w-[420px] grid-cols-4">
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="fills">Fills</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-white/50">
                    {symbol} • demo data
                  </div>
                </div>

                <TabsContent value="positions" className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instrument</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Entry</TableHead>
                        <TableHead className="text-right">PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">{symbol}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-600">Long</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          0.01
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          89320.5
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-200">
                          +12.40
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="orders" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    No open orders (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="fills" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    Fill history will go here (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    Alerts & notifications will go here (MVP).
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

