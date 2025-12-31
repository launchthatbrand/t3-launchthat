/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";

import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import type { AdminMetaBoxContext, GeneralMetaBoxData } from "../types";

const GeneralMetaBox = ({ data }: { data: GeneralMetaBoxData }) => {
  const {
    title,
    setTitle,
    supportsSlugEditing,
    slugValue,
    setSlugValue,
    slugPreviewUrl,
    originalSlug,
  } = data;

  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const slugInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSlugEditing) {
      slugInputRef.current?.focus();
      slugInputRef.current?.select();
    }
  }, [isSlugEditing]);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="post-title">Title</Label>
        <Input
          id="post-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a descriptive title"
        />
      </div>
      {supportsSlugEditing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="post-slug">Frontend Slug</Label>
            {!isSlugEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSlugEditing(true)}
                className="text-xs"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          {isSlugEditing ? (
            <Input
              id="post-slug"
              ref={slugInputRef}
              value={slugValue}
              onChange={(event) => setSlugValue(event.target.value)}
              placeholder="friendly-url-slug"
              onBlur={() => setIsSlugEditing(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  slugInputRef.current?.blur();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setSlugValue(originalSlug);
                  setIsSlugEditing(false);
                }
              }}
            />
          ) : (
            <div className="border-input bg-muted/40 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
              {slugPreviewUrl ? (
                <a
                  className="text-primary min-w-0 flex-1 truncate font-medium hover:underline"
                  href={slugPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {slugPreviewUrl}
                </a>
              ) : (
                <span className="text-muted-foreground">
                  Slug will be generated after saving.
                </span>
              )}
              {slugPreviewUrl ? (
                <Link
                  href={slugPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  aria-label="Open public page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            Must be unique; determines the public URL.
          </p>
        </div>
      )}
    </>
  );
};

export const registerGeneralMetaBox: () => void = () => {
  registerMetaBoxHook<AdminMetaBoxContext>("main", (context) => {
    const data = context.general;
    if (context.visibility?.showGeneralPanel === false || !data) {
      return null;
    }

    return {
      id: "core-general",
      title: "Title & Visibility",
      description: `Title and URL settings for this ${data.headerLabel} entry.`,
      location: "main",
      priority: 0,
      render: () => <GeneralMetaBox data={data} />,
    };
  });
};
