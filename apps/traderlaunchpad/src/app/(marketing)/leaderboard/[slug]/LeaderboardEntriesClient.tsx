"use client";

import Link from "next/link";
import React from "react";
import { useSearchParams } from "next/navigation";

interface Entry {
    rank: number;
    name: string;
    username: string;
    value: string;
    streak: string;
}

export const LeaderboardEntriesClient = ({ entries }: { entries: Entry[] }) => {
    const searchParams = useSearchParams();
    const requestedUser = searchParams.get("user");
    const requestedRank = searchParams.get("rank");

    const [highlightUsername, setHighlightUsername] = React.useState<string | null>(null);
    const rowRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});

    React.useEffect(() => {
        const byUser = requestedUser
            ? entries.find((e) => e.username.toLowerCase() === requestedUser.toLowerCase())
            : null;
        const byRank = requestedRank
            ? entries.find((e) => String(e.rank) === String(requestedRank))
            : null;
        const target = byUser ?? byRank;
        if (!target) return;

        setHighlightUsername(target.username);
        const el = rowRefs.current[target.username];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [entries, requestedRank, requestedUser]);

    return (
        <>
            {entries.map((entry) => {
                const isHighlighted =
                    highlightUsername?.toLowerCase() === entry.username.toLowerCase();
                return (
                    <Link
                        key={entry.rank}
                        href={`/u/${encodeURIComponent(entry.username)}`}
                        ref={(el) => {
                            rowRefs.current[entry.username] = el;
                        }}
                        className={[
                            "grid grid-cols-12 gap-2 border-t border-white/5 px-5 py-4 text-sm text-white/80 transition-colors",
                            "hover:bg-white/5 cursor-pointer",
                            isHighlighted ? "bg-orange-500/10 ring-1 ring-orange-500/30" : "",
                        ].join(" ")}
                    >
                        <div className="col-span-2 flex items-center gap-2">
                            <span
                                className={[
                                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                    isHighlighted ? "bg-orange-500/20 text-orange-100" : "bg-white/5 text-white",
                                ].join(" ")}
                            >
                                {entry.rank}
                            </span>
                        </div>
                        <div className="col-span-6 font-semibold text-white">{entry.name}</div>
                        <div className="col-span-2 text-right font-semibold text-orange-200">
                            {entry.value}
                        </div>
                        <div className="col-span-2 text-right text-white/60">{entry.streak}</div>
                    </Link>
                );
            })}
        </>
    );
};

