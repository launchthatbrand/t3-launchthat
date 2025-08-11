"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";

export interface FrontendSinglePostLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const FrontendSinglePostLayout = React.forwardRef<
  HTMLDivElement,
  FrontendSinglePostLayoutProps
>(({ children, className }, ref) => {
  return (
    <div ref={ref} className={`container flex gap-10 ${className ?? ""}`}>
      {children}
    </div>
  );
});
FrontendSinglePostLayout.displayName = "FrontendSinglePostLayout";

export interface FrontendSinglePostHeaderProps {
  title?: string;
  backHref?: string;
  subtitle?: string;
  breadcrumbs?: string[]; // e.g., ["Blog", "AI"]
  dateString?: string; // formatted date
  author?: { name: string; title?: string; avatarUrl?: string };
  rightImageUrl?: string;
  className?: string;
}

export const FrontendSinglePostHeader = React.forwardRef<
  HTMLDivElement,
  FrontendSinglePostHeaderProps
>(
  (
    {
      title,
      backHref = "/posts",
      subtitle,
      breadcrumbs,
      dateString,
      author,
      rightImageUrl,
      className,
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={`mb-10 ${className ?? ""}`}>
        <div className="container">
          <div className="mb-4 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href={backHref}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Link>
            </Button>
          </div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7 lg:col-span-6">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  {breadcrumbs.map((b, i) => (
                    <React.Fragment key={`${b}-${i}`}>
                      {i > 0 && <span className="opacity-60">→</span>}
                      <span>{b}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
              {dateString && (
                <div className="mb-4 text-sm text-muted-foreground">
                  {dateString}
                </div>
              )}
              {title ? (
                <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                  {title}
                </h1>
              ) : null}
              {author && (
                <div className="mt-6 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {author.avatarUrl ? (
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  )}
                  <div className="text-sm">
                    <div className="font-medium">{author.name}</div>
                    {author.title ? (
                      <div className="text-muted-foreground">
                        {author.title}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              {subtitle ? (
                <div className="mt-4 text-base text-muted-foreground">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="md:col-span-5 lg:col-span-6">
              {rightImageUrl ? (
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rightImageUrl}
                    alt={title ?? "Hero image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
FrontendSinglePostHeader.displayName = "FrontendSinglePostHeader";

export interface FrontendSinglePostMainProps {
  children: React.ReactNode;
  className?: string;
}

export const FrontendSinglePostMain = React.forwardRef<
  HTMLDivElement,
  FrontendSinglePostMainProps
>(({ children, className }, ref) => {
  return (
    <div ref={ref} className={`${className ?? ""} w-full`}>
      <div
        className={`prose prose-neutral dark:prose-invert max-w-none ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
});
FrontendSinglePostMain.displayName = "FrontendSinglePostMain";

export interface FrontendSinglePostSidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export const FrontendSinglePostSidebar = React.forwardRef<
  HTMLDivElement,
  FrontendSinglePostSidebarProps
>(({ children, className }, ref) => {
  return (
    <aside ref={ref} className={`md:w-1/4 ${className ?? ""}`}>
      <div className="sticky top-5 space-y-6">{children}</div>
    </aside>
  );
});
FrontendSinglePostSidebar.displayName = "FrontendSinglePostSidebar";
