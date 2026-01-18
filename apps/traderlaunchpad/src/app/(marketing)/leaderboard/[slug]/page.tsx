import { ArrowLeft, ArrowRight, Award, Crown, Flame, Medal, Sparkles, Trophy } from "lucide-react";

import { Button } from "@acme/ui/moving-border";
import { LeaderboardEntriesClient } from "./LeaderboardEntriesClient";
import Link from "next/link";
import React from "react";
import { demoPublicUsers } from "@acme/demo-data";
import { notFound } from "next/navigation";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

// Helper to format users for the list
const formatUser = (u: typeof demoPublicUsers[0], rank: number, value: string, streak: string) => ({
    rank,
    name: u.username,
    username: u.username,
    value,
    streak,
});

const getEntries = (slug: string) => {
    switch (slug) {
        case "top-performers":
            return demoPublicUsers
                .sort((a, b) => b.stats.monthlyReturn - a.stats.monthlyReturn)
                .slice(0, 20)
                .map((u, i) => formatUser(u, i + 1, `+${u.stats.monthlyReturn}%`, `${u.stats.streak} wins`));
        case "consistency-champs":
            return demoPublicUsers
                .sort((a, b) => b.stats.winRate - a.stats.winRate)
                .slice(0, 20)
                .map((u, i) => formatUser(u, i + 1, `${u.stats.winRate}%`, `${u.stats.streak} weeks`));
        case "risk-discipline":
            return demoPublicUsers
                .sort((a, b) => b.stats.profitFactor - a.stats.profitFactor)
                .slice(0, 20)
                .map((u, i) => formatUser(u, i + 1, `${u.stats.profitFactor} PF`, u.badges.some(b => b.id === 'b-risk') ? "Perfect" : "Good"));
        case "b-review":
            return demoPublicUsers
                .filter((u) => u.badges.some((b) => b.id === "b-review"))
                .map((u) => {
                    const lb = u.leaderboards.find((x) => x.id === "lb-b-review");
                    return {
                        u,
                        rank: lb?.rank ?? 9999,
                        value: `${u.stats.streak} reviews`,
                        streak: `${u.stats.streak} weeks`,
                    };
                })
                .sort((a, b) => a.rank - b.rank)
                .map(({ u, rank, value, streak }) => formatUser(u, rank, value, streak));
        case "b-overlap":
            return demoPublicUsers
                .filter((u) => u.badges.some((b) => b.id === "b-overlap"))
                .map((u) => {
                    const lb = u.leaderboards.find((x) => x.id === "lb-b-overlap");
                    return {
                        u,
                        rank: lb?.rank ?? 9999,
                        value: `${u.stats.winRate}% win rate`,
                        streak: "Session Pro",
                    };
                })
                .sort((a, b) => a.rank - b.rank)
                .map(({ u, rank, value, streak }) => formatUser(u, rank, value, streak));
        default:
            return [];
    }
};

const normalizeLeaderboardSlug = (slug: string) => {
    switch (slug) {
        case "session-specialist":
            return "b-overlap";
        case "weekly-review":
            return "b-review";
        default:
            return slug;
    }
};

interface LeaderboardMeta {
    slug: string;
    title: string;
    type: "badge" | "performance" | "custom";
    description: string;
    metricLabel: string;
    badgeRule?: string;
    icon: typeof Award;
}

const leaderboardData: LeaderboardMeta[] = [
    {
        slug: "b-review",
        title: "Weekly review",
        type: "badge",
        description:
            "Earned by publishing 4 weekly reviews in a single month. Track who is consistently closing the loop.",
        metricLabel: "Reviews",
        badgeRule: "Publish 4 weekly reviews in 30 days.",
        icon: Award,
    },
    {
        slug: "b-overlap",
        title: "Session specialist",
        type: "badge",
        description:
            "Earned by logging 20+ trades in a single session with 70%+ win rate.",
        metricLabel: "Session wins",
        badgeRule: "20+ trades in one session with 70%+ win rate.",
        icon: Sparkles,
    },
    {
        slug: "top-performers",
        title: "Top performers",
        type: "performance",
        description: "Best ROI over the last 30 days across verified journals.",
        metricLabel: "ROI",
        icon: Crown,
    },
    {
        slug: "consistency-champs",
        title: "Consistency champs",
        type: "performance",
        description: "Most consistent weekly gains with low drawdown.",
        metricLabel: "Win Rate",
        icon: Medal,
    },
    {
        slug: "risk-discipline",
        title: "Risk discipline",
        type: "performance",
        description: "Lowest rule violations and strongest risk adherence.",
        metricLabel: "Efficiency",
        icon: Trophy,
    },
];

const findCustomLeaderboardBySlug = (slug: string) => {
    for (const u of demoPublicUsers) {
        for (const lb of u.leaderboards) {
            if (slugify(lb.label) === slug) {
                return { id: lb.id, label: lb.label };
            }
        }
    }
    return null;
};

const getCustomLeaderboardEntries = (leaderboardId: string) => {
    return demoPublicUsers
        .map((u) => {
            const lb = u.leaderboards.find((x) => x.id === leaderboardId);
            if (!lb) return null;
            return {
                u,
                rank: lb.rank,
                value: `${u.stats.monthlyReturn}% ROI`,
                streak: `${u.stats.winRate}% win rate`,
            };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .sort((a, b) => a.rank - b.rank)
        .map(({ u, rank, value, streak }) => formatUser(u, rank, value, streak));
};

export default async function LeaderboardDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const canonicalSlug = normalizeLeaderboardSlug(slug);
    const leaderboard =
        leaderboardData.find((item) => item.slug === canonicalSlug) ??
        (() => {
            const custom = findCustomLeaderboardBySlug(canonicalSlug);
            if (!custom) return null;
            const title = custom.label;
            return {
                slug: canonicalSlug,
                title,
                type: "custom" as const,
                description: `Rankings for ${title.toLowerCase()} based on demo data.`,
                metricLabel: "Metric",
                icon: Trophy,
                customLeaderboardId: custom.id,
            };
        })();

    if (!leaderboard) {
        notFound();
    }

    const entries =
        "customLeaderboardId" in leaderboard
            ? getCustomLeaderboardEntries(leaderboard.customLeaderboardId)
            : getEntries(canonicalSlug);
    const Icon = leaderboard.icon;
    const isBadge = leaderboard.type === "badge";

    return (
        <div className="relative min-h-screen text-white selection:bg-orange-500/30">
            <main className="relative z-10 pt-28">
                <section className="container mx-auto max-w-6xl px-4">
                    <Link
                        href="/leaderboards"
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to leaderboards
                    </Link>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur-md">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
                                        <Icon className="h-3.5 w-3.5" />
                                        {isBadge ? "Badge leaderboard" : "Performance leaderboard"}
                                    </div>
                                    {isBadge ? (
                                        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/70">
                                            Badge track
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-white/70">
                                            30-day snapshot
                                        </span>
                                    )}
                                </div>
                                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
                                    {leaderboard.title}
                                </h1>
                                <p className="mt-3 text-sm text-white/60 md:text-base">
                                    {leaderboard.description}
                                </p>

                                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                                    <div className="grid grid-cols-12 gap-2 bg-black/40 px-5 py-3 text-xs font-semibold text-white/60">
                                        <div className="col-span-2">Rank</div>
                                        <div className="col-span-6">Trader</div>
                                        <div className="col-span-2 text-right">
                                            {leaderboard.metricLabel}
                                        </div>
                                        <div className="col-span-2 text-right">Streak</div>
                                    </div>
                                    <LeaderboardEntriesClient entries={entries} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
                                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                                    <Flame className="h-4 w-4 text-orange-200/80" />
                                    Next milestone
                                </div>
                                <p className="mt-3 text-sm text-white/60">
                                    Keep climbing the leaderboard by logging consistent sessions and
                                    sharing review notes with the community.
                                </p>
                                {isBadge ? (
                                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                                        <div className="text-xs font-semibold text-white/80">
                                            Badge requirement
                                        </div>
                                        <div className="mt-2">{leaderboard.badgeRule}</div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
                                <div className="text-sm font-semibold text-white/80">
                                    Join the race
                                </div>
                                <p className="mt-2 text-sm text-white/60">
                                    Review your trades, refine your rules, and climb in real time.
                                </p>
                                <div className="mt-5">
                                    <Link href="/sign-up" className="inline-block">
                                        <Button
                                            as="div"
                                            borderRadius="1.75rem"
                                            containerClassName="h-11 w-auto min-w-[160px]"
                                            className="bg-white text-black font-medium border-neutral-200 dark:border-slate-800 cursor-pointer"
                                        >
                                            <span className="flex w-full items-center justify-between gap-3 px-1">
                                                <span className="w-full text-center font-bold">
                                                    Get started
                                                </span>
                                                <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-black text-white">
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </span>
                                            </span>
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
