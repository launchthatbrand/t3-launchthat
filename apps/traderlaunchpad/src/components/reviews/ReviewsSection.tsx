import { Star } from "lucide-react";
import { demoReviews, demoPublicUsers } from "@acme/demo-data";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";

type ReviewTarget =
  | { kind: "firm"; slug: string }
  | { kind: "broker"; slug: string }
  | { kind: "user"; username: string };

type DemoReviewLite = (typeof demoReviews)[number];

const getStars = (rating: number) => {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={[
          "h-4 w-4",
          i <= rating ? "fill-orange-400 text-orange-300" : "text-white/20",
        ].join(" ")}
      />,
    );
  }
  return stars;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const ReviewsSection = ({
  target,
  title = "Reviews",
  subtitle,
  showWriteCta = true,
}: {
  target: ReviewTarget;
  title?: string;
  subtitle?: string;
  showWriteCta?: boolean;
}) => {
  const reviews = (demoReviews as unknown as DemoReviewLite[])
    .filter((r) => {
      switch (target.kind) {
        case "firm":
          return r.target.kind === "firm" && r.target.slug === target.slug;
        case "broker":
          return r.target.kind === "broker" && r.target.slug === target.slug;
        case "user":
          return (
            r.target.kind === "user" &&
            r.target.username.toLowerCase() === target.username.toLowerCase()
          );
        default:
          return false;
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  interface Viewer {
    username: string;
    reviewSettings?: { canWriteReviews?: boolean };
  }
  interface ReviewTargetUser {
    username: string;
    reviewSettings?: { allowProfileReviews?: boolean };
  }

  // Mock "viewer": use a known demo user to drive settings.
  const viewer = (demoPublicUsers as unknown as Viewer[]).find((u) => u.username === "kairos.fx");
  const viewerCanWrite = Boolean(viewer?.reviewSettings?.canWriteReviews ?? true);

  const targetAllowsReviews =
    target.kind === "user"
      ? Boolean(
          (demoPublicUsers as unknown as ReviewTargetUser[]).find(
            (u) => u.username.toLowerCase() === target.username.toLowerCase(),
          )?.reviewSettings?.allowProfileReviews ?? true,
        )
      : true;

  const canWrite = viewerCanWrite && targetAllowsReviews;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-7 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white/85">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-white/55">{subtitle}</div> : null}
        </div>

        {showWriteCta ? (
          <Button
            asChild
            className={[
              "h-10 rounded-full",
              canWrite
                ? "bg-white text-black hover:bg-gray-100"
                : "cursor-not-allowed bg-white/20 text-white/50 hover:bg-white/20",
            ].join(" ")}
          >
            <Link href="#" aria-disabled={!canWrite} tabIndex={canWrite ? 0 : -1}>
              Write a review
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
            No reviews yet.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/u/${encodeURIComponent(r.author.username)}`}
                      className="group/author flex items-center gap-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
                        {r.author.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.author.avatarUrl}
                            alt={r.author.username}
                            className="h-full w-full object-cover opacity-95"
                          />
                        ) : (
                          <div className="text-xs font-semibold text-white/70">
                            {(r.author.displayName || r.author.username || "U")
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90 group-hover/author:text-white">
                          {r.author.displayName}{" "}
                          <span className="font-normal text-white/45">
                            @{r.author.username}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-1">{getStars(r.rating)}</div>
                          <div className="text-xs text-white/45">{formatDate(r.createdAt)}</div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm font-semibold text-white/90">{r.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-white/65">{r.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

