"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

const LABEL_MAP: Record<
  string,
  { noun: string; description: string; cta: string }
> = {
  courses: {
    noun: "course",
    description: "Track your overall course progress right from the lesson.",
    cta: "Complete course",
  },
  lessons: {
    noun: "lesson",
    description: "When you’re done learning, tap to mark the lesson complete.",
    cta: "Complete lesson",
  },
  topics: {
    noun: "topic",
    description: "Log topic-level progress without leaving the page.",
    cta: "Complete topic",
  },
  quizzes: {
    noun: "quiz",
    description: "Record manual quiz completions for your own tracking.",
    cta: "Complete quiz",
  },
};

export function FrontendLessonCompletionCallout({
  postTypeSlug,
  post,
  pluginName,
}: PluginFrontendSingleSlotProps) {
  const config = LABEL_MAP[postTypeSlug];
  const [isCompleting, setIsCompleting] = useState(false);

  if (!config || !post) {
    return null;
  }

  const title =
    typeof (post as { title?: unknown }).title === "string"
      ? ((post as { title: string }).title ?? config.noun)
      : config.noun;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Placeholder – integrate Convex progress mutation once available.
      toast.success(
        `${config.noun.replace(/^\w/, (c) => c.toUpperCase())} logged`,
        {
          description: `"${title}" marked complete via ${pluginName}.`,
        },
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-card/70 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="tracking-wide uppercase">
              LMS
            </Badge>
            <span className="text-muted-foreground text-sm font-medium">
              Learner progress
            </span>
          </div>
          <p className="text-foreground text-sm">{config.description}</p>
        </div>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={isCompleting}
          className="whitespace-nowrap"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isCompleting ? "Recording…" : config.cta}
        </Button>
      </div>
    </div>
  );
}
