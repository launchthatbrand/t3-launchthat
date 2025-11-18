"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Facebook, Linkedin, Mail, Share2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import {
  FrontendSinglePostHeader,
  FrontendSinglePostLayout,
  FrontendSinglePostMain,
  FrontendSinglePostSidebar,
} from "~/components/frontend/FrontendSinglePostLayout";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as Id<"posts">;
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  const post = useQuery(
    api.core.posts.queries.getPostById,
    postId
      ? organizationId
        ? { id: postId, organizationId }
        : { id: postId }
      : "skip",
  );

  if (post === undefined) {
    return <div className="container py-6">Loading…</div>;
  }
  if (!post) {
    return <div className="container py-6">Post not found</div>;
  }

  return <PostContentView post={post as Doc<"posts">} />;
}

function PostContentView({ post }: { post: Doc<"posts"> }) {
  const p = post;

  // Try parse content as serialized editor state (memoized to avoid new object each render)
  const serialized = useMemo<object | undefined>(() => {
    try {
      const parsed: unknown = p.content ? JSON.parse(p.content) : undefined;
      return parsed &&
        typeof parsed === "object" &&
        "root" in (parsed as object)
        ? (parsed as object)
        : undefined;
    } catch {
      return undefined;
    }
  }, [p.content]);

  const subtitleParts: string[] = [];
  if (p.category) subtitleParts.push(p.category);
  if (p.readTime) subtitleParts.push(p.readTime);
  const subtitle = subtitleParts.join(" • ");

  const dateString = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString()
    : undefined;

  // Social share
  const [shareUrl, setShareUrl] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, []);

  const twitterUrl = useMemo(
    () =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(p.title)}`,
    [shareUrl, p.title],
  );
  const linkedinUrl = useMemo(
    () =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    [shareUrl],
  );
  const facebookUrl = useMemo(
    () =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    [shareUrl],
  );
  const mailtoUrl = useMemo(
    () =>
      `mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent(shareUrl)}`,
    [shareUrl, p.title],
  );

  // In this article (TOC): derive from rendered headings
  const contentRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>(
    [],
  );
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1,h2,h3"),
    );
    const toSlug = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    const items: { id: string; text: string; level: number }[] = [];
    headings.forEach((h) => {
      const text = h.textContent ?? "";
      const id = toSlug(text);
      if (!h.id) h.id = id;
      const level = h.tagName === "H1" ? 1 : h.tagName === "H2" ? 2 : 3;
      items.push({ id, text, level });
    });
    setToc(items);
  }, [serialized, p.title]);

  return (
    <>
      <FrontendSinglePostHeader
        title={p.title}
        subtitle={subtitle}
        backHref="/posts"
        breadcrumbs={["Blog", p.category ?? ""]}
        dateString={dateString}
        author={undefined}
        className="bg-primary/30"
        rightImageUrl={p.featuredImageUrl}
      />
      <FrontendSinglePostLayout className="gap-20">
        <FrontendSinglePostSidebar>
          {/* Share */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.open(twitterUrl, "_blank")}
              className="rounded-full border p-2 text-muted-foreground hover:bg-accent"
              aria-label="Share on X/Twitter"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => window.open(linkedinUrl, "_blank")}
              className="rounded-full border p-2 text-muted-foreground hover:bg-accent"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => window.open(facebookUrl, "_blank")}
              className="rounded-full border p-2 text-muted-foreground hover:bg-accent"
              aria-label="Share on Facebook"
            >
              <Facebook className="h-4 w-4" />
            </button>
            <a
              href={mailtoUrl}
              className="rounded-full border p-2 text-muted-foreground hover:bg-accent"
              aria-label="Share via Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>

          {/* TOC */}
          <div className="mb-8">
            <h3 className="mb-3 text-base font-semibold">In this article</h3>
            <hr className="mb-4" />
            <nav className="space-y-2 text-sm">
              {toc.map((item) => (
                <div key={item.id} className={item.level > 1 ? "pl-4" : ""}>
                  <a
                    href={`#${item.id}`}
                    className="text-foreground/80 hover:underline"
                  >
                    {item.text}
                  </a>
                </div>
              ))}
              {toc.length === 0 && (
                <div className="text-muted-foreground">No headings yet</div>
              )}
            </nav>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-2 text-[13px] text-muted-foreground">
              5 stars 2,000+ reviews
            </div>
            <div className="mb-2 text-xl font-semibold">
              Spending made smarter
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Easy-to-use cards, funds, approval flows, vendor payments — plus
              an average savings of 5%.
            </p>
            <div className="mb-3">
              <Input type="email" placeholder="What’s your work email?" />
            </div>
            <Button className="w-full" size="lg">
              Get started
            </Button>
          </div>
        </FrontendSinglePostSidebar>
        <FrontendSinglePostMain>
          <Card className="rounded-none border-none p-0 shadow-none">
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-0">
              {p.excerpt && (
                <p className="mb-4 text-xl text-muted-foreground">
                  {p.excerpt}
                </p>
              )}
              <div ref={contentRef}>
                {serialized ? (
                  <EditorViewer
                    editorSerializedState={serialized}
                    className="text-lg"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap">{p.content}</pre>
                )}
              </div>
            </CardContent>
          </Card>
        </FrontendSinglePostMain>
      </FrontendSinglePostLayout>
    </>
  );
}
