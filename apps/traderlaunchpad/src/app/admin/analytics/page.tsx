"use client";

import React from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Filter,
  PieChart,
  TrendingUp,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function AdminAnalyticsPage() {
  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into your trading performance and metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Net P&L
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              +$2,450.00
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              +18% vs last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Profit Factor
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.41</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Gross Win / Gross Loss
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Win Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-muted-foreground mt-1 text-xs">
              34 Wins / 16 Losses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Avg R:R
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.85</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Risk Reward Ratio
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Perf</TabsTrigger>
        </TabsList>

        <TabsContent value="equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Growth</CardTitle>
              <CardDescription>
                Cumulative profit and loss over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-border group relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-linear-to-b from-blue-500/5 to-transparent">
                <div className="text-muted-foreground/30 absolute inset-0 z-10 flex items-center justify-center font-medium">
                  [ Interactive Equity Chart ]
                </div>
                {/* Decorative background graph */}
                <svg
                  className="absolute right-0 bottom-0 left-0 h-full w-full opacity-20 transition-opacity group-hover:opacity-30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,350 L50,340 L100,300 L150,310 L200,250 L250,270 L300,200 L350,180 L400,150 L450,160 L500,100 L550,80 L600,120 L650,50 L700,20 L800,10 L800,400 L0,400 Z"
                    fill="url(#blue-gradient)"
                  />
                  <defs>
                    <linearGradient
                      id="blue-gradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="drawdown">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Analysis</CardTitle>
              <CardDescription>
                Visualize risk and recovery periods.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground flex h-[400px] items-center justify-center">
              [ Drawdown Chart Placeholder ]
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance</CardTitle>
              <CardDescription>
                Best trading hours based on PnL.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground flex h-[400px] items-center justify-center">
              [ Heatmap Chart Placeholder ]
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Assets</CardTitle>
            <CardDescription>Where you make the most money.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["XAUUSD", "NAS100", "US30", "EURUSD", "GBPUSD"].map(
              (symbol, i) => (
                <div key={symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">
                      {i + 1}
                    </div>
                    <span className="font-medium">{symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-emerald-500">
                      +${(1000 - i * 150).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {15 - i} trades
                    </div>
                  </div>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
            <CardDescription>Average PnL per trade outcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Win</span>
                <span className="font-medium text-emerald-500">+$250.00</span>
              </div>
              <div className="bg-secondary h-2 overflow-hidden rounded-full">
                <div className="h-full w-[70%] bg-emerald-500" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Loss</span>
                <span className="font-medium text-red-500">-$110.00</span>
              </div>
              <div className="bg-secondary h-2 overflow-hidden rounded-full">
                <div className="h-full w-[30%] bg-red-500" />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Largest Win</span>
              <span className="font-bold text-emerald-500">+$1,200.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Loss</span>
              <span className="font-bold text-red-500">-$450.00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
