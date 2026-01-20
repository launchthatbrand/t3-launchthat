"use client";

import * as React from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { useClerk, useSession } from "@clerk/nextjs";

import { Button } from "@acme/ui/button";

export function TraderLaunchpadNavUser(props: { afterSignOutUrl?: string }) {
    const { session } = useSession();
    const { openSignIn, signOut } = useClerk();

    if (!session) {
        return (
            <Button
                type="button"
                variant="ghost"
                className="text-gray-200 hover:bg-white/10 hover:text-white"
                onClick={() => void openSignIn({})}
            >
                Sign in
            </Button>
        );
    }

    const name = session.user.fullName ?? session.user.username ?? "User";
    const email = session.user.emailAddresses[0]?.emailAddress ?? "";
    const avatar = session.user.imageUrl;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={avatar}
                        alt={name}
                        className="h-7 w-7 rounded-full border border-white/10 object-cover"
                    />
                    <span className="hidden max-w-40 truncate font-medium sm:inline">
                        {name}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-0.5">
                    <div className="truncate text-sm font-medium">{name}</div>
                    {email ? (
                        <div className="text-muted-foreground truncate text-xs">{email}</div>
                    ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => {
                        if (typeof window === "undefined") return;
                        window.location.assign("/admin/dashboard");
                    }}
                >
                    <Settings className="h-4 w-4" />
                    Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => {
                        if (typeof window === "undefined") return;
                        window.location.assign("/admin/settings");
                    }}
                >
                    <User className="h-4 w-4" />
                    Account settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    variant="destructive"
                    onClick={async () => {
                        await signOut();
                        if (props.afterSignOutUrl && typeof window !== "undefined") {
                            window.location.assign(props.afterSignOutUrl);
                        }
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

