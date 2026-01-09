 
 
 
 
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
    isTitleEditable,
    supportsSlugEditing,
    isSlugEditable,
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
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="post-title" className="text-xs">
          Title
        </Label>
        <Input
          id="post-title"
          value={title}
          onChange={(event) => {
            if (!isTitleEditable) return;
            setTitle(event.target.value);
          }}
          placeholder={isTitleEditable ? "Title" : "Generated on save"}
          className="h-9"
          disabled={!isTitleEditable}
        />
      </div>
      {supportsSlugEditing && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="post-slug" className="text-xs">
              URL
            </Label>
            {!isSlugEditing && isSlugEditable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSlugEditing(true)}
                className="h-7 px-2 text-xs"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          {isSlugEditing && isSlugEditable ? (
            <Input
              id="post-slug"
              ref={slugInputRef}
              value={slugValue}
              onChange={(event) => setSlugValue(event.target.value)}
              placeholder="friendly-url-slug"
              className="h-9"
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
            <div className="bg-muted/40 border-input flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs">
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
                  Generated after save
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
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          )}
          <p className="text-muted-foreground text-[11px] leading-tight">
            Public URL; must be unique.
          </p>
        </div>
      )}
    </div>
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
