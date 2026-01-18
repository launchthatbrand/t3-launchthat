import { ArrowRight, Medal, Sparkles, Trophy, User } from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import Link from "next/link";
import React from "react";
import { demoPublicUsers } from "@acme/demo-data";

// Helper to format users
const formatUser = (u: typeof demoPublicUsers[0], rank: number, value: string) => ({
    rank,
    name: u.username, // Display username
    username: u.username,
    value,
});

// Sort by monthly return
const topPerformersData = demoPublicUsers
    .sort((a, b) => b.stats.monthlyReturn - a.stats.monthlyReturn)
    .slice(0, 5)
    .map((u, i) => formatUser(u, i + 1, `+${u.stats.monthlyReturn}%`));

// Sort by win rate
const consistencyData = demoPublicUsers
    .sort((a, b) => b.stats.winRate - a.stats.winRate)
    .slice(0, 5)
    .map((u, i) => formatUser(u, i + 1, `${u.stats.winRate}%`));

// Sort by profit factor (proxy for risk)
const riskData = demoPublicUsers
    .sort((a, b) => b.stats.profitFactor - a.stats.profitFactor)
    .slice(0, 5)
    .map((u, i) => formatUser(u, i + 1, `${u.stats.profitFactor} PF`));

// Filter by badge
const badgeReviewData = demoPublicUsers
    .filter(u => u.badges.some(b => b.id === 'b-review'))
    .slice(0, 5)
    .map((u, i) => formatUser(u, i + 1, `${u.stats.streak} Mo Streak`));

const badgeOverlapData = demoPublicUsers
    .filter(u => u.badges.some(b => b.id === 'b-overlap'))
    .slice(0, 5)
    .map((u, i) => formatUser(u, i + 1, `Session Pro`));

const leaderboards = [
    {
        slug: "top-performers",
        title: "Top performers",
        description: "Best ROI over the last 30 days across verified journals.",
        tag: "Performance",
        icon: Trophy,
        topUsers: topPerformersData
    },
    {
        slug: "consistency-champs",
        title: "Consistency champs",
        description: "Most consistent weekly gains with low drawdown.",
        tag: "Consistency",
        icon: Medal,
        topUsers: consistencyData
    },
    {
        slug: "risk-discipline",
        title: "Risk discipline",
        description: "Lowest rule violations and strongest risk adherence.",
        tag: "Risk",
        icon: Sparkles,
        topUsers: riskData
    },
];

const badgeLeaderboards = [
    {
        slug: "b-review",
        title: "Weekly review",
        description: "Earned by publishing 4 reviews in a single month.",
        tag: "Badge",
        topUsers: badgeReviewData
    },
    {
        slug: "b-overlap",
        title: "Session specialist",
        description: "Earned by mastering one session with 20+ trades logged.",
        tag: "Badge",
        topUsers: badgeOverlapData
    },
];

export default function LeaderboardsPage() {
    return (
        <div className="relative min-h-screen text-white selection:bg-orange-500/30">
            <main className="relative z-10 pt-28">
                <section className="container mx-auto max-w-7xl px-4">
                    <div className="mb-10">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200 backdrop-blur-sm">
                            Community rankings
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                            Leaderboards
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
                            Track performance, discipline, and progress. Badge leaderboards
                            highlight users earning milestone achievements.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {leaderboards.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.slug}
                                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 flex flex-col h-full"
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
                                    <div className="relative flex flex-col h-full">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm w-fit">
                                            <Icon className="h-3.5 w-3.5 text-orange-200" />
                                            {item.tag}
                                        </div>
                                        <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-white/60 mb-6">{item.description}</p>

                                        <div className="flex-1 space-y-1 mb-8">
                                            {item.topUsers.map((user) => (
                                                <Link
                                                    key={user.rank}
                                                    href={`/u/${user.username}`}
                                                    className="flex items-center justify-between text-sm rounded-lg p-2 -mx-2 hover:bg-white/5 transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                                            user.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                                                                user.rank === 3 ? "bg-orange-700/20 text-orange-600" :
                                                                    "bg-white/5 text-white/40"
                                                            }`}>
                                                            {user.rank}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                                                                <User className="h-3 w-3 text-white/50" />
                                                            </div>
                                                            <span className="font-medium text-white/90">{user.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-white/60">{user.value}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <Link href={`/leaderboard/${item.slug}`} className="inline-block w-full">
                                                <Button
                                                    as="div"
                                                    borderRadius="1.75rem"
                                                    containerClassName="h-10 w-full"
                                                    className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                                                >
                                                    <span className="flex w-full items-center justify-between gap-3 px-1">
                                                        <span className="w-full text-center font-bold text-sm">
                                                            View All
                                                        </span>
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shrink-0">
                                                            <ArrowRight className="h-3 w-3" />
                                                        </span>
                                                    </span>
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                            <Sparkles className="h-4 w-4 text-orange-200/80" />
                            Badge leaderboards
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {badgeLeaderboards.map((item) => (
                                <div
                                    key={item.slug}
                                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6 flex flex-col h-full"
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-70" />
                                    <div className="relative flex flex-col h-full">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200 w-fit">
                                            {item.tag}
                                        </div>
                                        <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-white/60 mb-6">{item.description}</p>

                                        <div className="flex-1 space-y-1 mb-8">
                                            {item.topUsers.map((user) => (
                                                <Link
                                                    key={user.rank}
                                                    href={`/u/${user.username}`}
                                                    className="flex items-center justify-between text-sm rounded-lg p-2 -mx-2 hover:bg-white/5 transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                                            user.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                                                                user.rank === 3 ? "bg-orange-700/20 text-orange-600" :
                                                                    "bg-white/5 text-white/40"
                                                            }`}>
                                                            {user.rank}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                                                                <User className="h-3 w-3 text-white/50" />
                                                            </div>
                                                            <span className="font-medium text-white/90">{user.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-white/60">{user.value}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <Link href={`/leaderboard/${item.slug}`} className="inline-block w-full">
                                                <Button
                                                    as="div"
                                                    borderRadius="1.75rem"
                                                    containerClassName="h-10 w-full"
                                                    className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                                                >
                                                    <span className="flex w-full items-center justify-between gap-3 px-1">
                                                        <span className="w-full text-center font-bold text-sm">
                                                            View All
                                                        </span>
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shrink-0">
                                                            <ArrowRight className="h-3 w-3" />
                                                        </span>
                                                    </span>
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-24" />
                </section>
            </main>
        </div>
    );
}
