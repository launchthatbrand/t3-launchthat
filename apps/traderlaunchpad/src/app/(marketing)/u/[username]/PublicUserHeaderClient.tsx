"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@acme/ui/button";

type ViewerUser = {
  email?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function PublicUserHeaderClient(props: {
  username: string;
  baseHref: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  coverUrl?: string;
  primaryBroker: string;
  followers: number;
  following: number;
  likes: number;
  isPrivateLabel: string;
}) {
  const [displayName, setDisplayName] = React.useState(props.displayName);
  const [bio, setBio] = React.useState(props.bio);
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(props.avatarUrl);
  const [coverUrl, setCoverUrl] = React.useState<string | undefined>(props.coverUrl);

  React.useEffect(() => {
    setDisplayName(props.displayName);
    setBio(props.bio);
    setAvatarUrl(props.avatarUrl);
    setCoverUrl(props.coverUrl);
  }, [props.displayName, props.bio, props.avatarUrl, props.coverUrl]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const jsonUnknown: unknown = await res.json().catch(() => null);
        if (!jsonUnknown || typeof jsonUnknown !== "object") return;
        const user = (jsonUnknown as { user?: unknown }).user;
        if (!user || typeof user !== "object") return;

        const u = user as ViewerUser;
        const email = typeof u.email === "string" ? u.email : "";
        const name = typeof u.name === "string" ? u.name : "";
        const fallback = email ? (email.split("@")[0] ?? "") : "";
        const slug = slugify(name || fallback || "");
        if (!slug || slug !== props.username) return;

        if (cancelled) return;
        setDisplayName(name || fallback || props.displayName);
        setBio(typeof u.bio === "string" && u.bio.trim() ? u.bio : props.bio);
        setAvatarUrl(typeof u.avatarUrl === "string" ? u.avatarUrl : props.avatarUrl);
        setCoverUrl(typeof u.coverUrl === "string" ? u.coverUrl : props.coverUrl);
      } catch {
        // ignore
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [props.username, props.displayName, props.bio, props.avatarUrl, props.coverUrl]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md">
      <div className="relative">
        <div className="h-32 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent" />
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <Button
        asChild
        variant="outline"
        className="absolute top-4 left-4 h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
      >
        <Link href="/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All users
        </Link>
      </Button>

      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-24 md:w-24">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={props.username}
                  className="h-full w-full object-cover opacity-95"
                />
              ) : (
                <div className="text-2xl font-semibold text-white/70">
                  {String(displayName).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
                Public profile
              </div>
              <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-4xl">
                {displayName}
              </h1>
              <div className="mt-1 text-sm text-white/55">@{props.username}</div>
              <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">{bio}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Follow
            </Button>
            <Button className="h-10 rounded-full border-0 bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href="/join">Get in touch</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="text-xs text-white/50">Followers</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-white">
              {props.followers.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="text-xs text-white/50">Following</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-white">
              {props.following.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="text-xs text-white/50">Likes</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-white">
              {props.likes.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="text-xs text-white/50">Broker</div>
            <div className="mt-1 truncate text-base font-semibold text-white/90">
              {props.primaryBroker}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/10 pt-4 text-sm text-white/60">
          <Link href={props.baseHref} className="hover:text-white">
            Work
          </Link>
          <Link href={`${props.baseHref}/trades`} className="hover:text-white">
            Trades
          </Link>
          <Link href={`${props.baseHref}/orders`} className="hover:text-white">
            Orders
          </Link>
          <Link href={`${props.baseHref}/tradeideas`} className="hover:text-white">
            Trade ideas
          </Link>

          <div className="ml-auto flex items-center gap-3 text-sm text-white/60">
            <Link href="/brokers" className="inline-flex items-center gap-2 hover:text-white">
              Brokers <ExternalLink className="h-4 w-4" />
            </Link>
            <Link href="/firms" className="inline-flex items-center gap-2 hover:text-white">
              Prop firms <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="ml-auto text-xs text-white/45">{props.isPrivateLabel}</div>
        </div>
      </div>
    </div>
  );
}

