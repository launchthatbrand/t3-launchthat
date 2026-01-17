"use client";

import { Activity, ArrowUpRight, Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Card, CardContent } from "@acme/ui/card";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { cn } from "@acme/ui";

export interface DashboardHeroProps {
  dateLabel: string;
  onSyncAction?: () => void;

  profile: {
    avatarUrl?: string;
    title: string;
    subtitle: string;
    totalTrades: number;
    avgPnl: number;
    editHref: string;
  };
}

const StatPill = ({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
      <div className="text-[11px] font-medium text-white/50">{label}</div>
      <div className={cn("text-sm font-semibold text-white/85", valueClassName)}>
        {value}
      </div>
    </div>
  );
};

export const DashboardHero = ({ dateLabel, onSyncAction, profile }: DashboardHeroProps) => {
  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/3 backdrop-blur-md">
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />

      <CardContent className="relative p-6 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: heading + profile */}
          <div className="min-w-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="min-w-0">
                <div className="text-3xl font-bold tracking-tight">Dashboard</div>
                <div className="mt-1 text-white/70">
                  Welcome back. You&apos;re trading well today.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src={profile.avatarUrl} alt="Profile" />
                <AvatarFallback className="bg-white/10 text-xs text-white/80">
                  TL
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <User className="h-4 w-4 text-orange-300" />
                  {profile.title}
                </div>
                <div className="mt-1 text-sm text-white/60">{profile.subtitle}</div>
              </div>
            </div>
          </div>

          {/* Right: actions + stats */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:flex-col lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Calendar className="h-4 w-4" />
                <span>{dateLabel}</span>
              </Button>
              <Button
                className="gap-2 border-0 bg-orange-600 text-white hover:bg-orange-700"
                onClick={onSyncAction}
              >
                <Activity className="h-4 w-4" />
                Sync Account
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatPill
                label="Total trades"
                value={profile.totalTrades.toLocaleString()}
              />
              <StatPill
                label="Avg P&L"
                value={`${profile.avgPnl >= 0 ? "+" : "-"}$${Math.abs(profile.avgPnl).toFixed(0)}`}
                valueClassName={profile.avgPnl >= 0 ? "text-emerald-400" : "text-red-400"}
              />
              <Button
                asChild
                className="border-0 bg-orange-600 text-white hover:bg-orange-700"
              >
                <Link href={profile.editHref}>
                  Edit public profile <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

