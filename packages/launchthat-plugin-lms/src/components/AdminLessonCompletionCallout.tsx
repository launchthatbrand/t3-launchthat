import type { PluginSingleViewSlotProps } from "launchthat-plugin-core";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

const LABEL_MAP: Record<
  string,
  { noun: string; description: string; cta: string }
> = {
  courses: {
    noun: "course",
    description: "Track completion for the entire course outline.",
    cta: "Complete course",
  },
  lessons: {
    noun: "lesson",
    description: "Quickly mark a learner complete directly from the editor.",
    cta: "Complete lesson",
  },
  topics: {
    noun: "topic",
    description: "Flag this topic as complete without leaving the page.",
    cta: "Complete topic",
  },
  quizzes: {
    noun: "quiz",
    description: "Use this control to manually record quiz completion.",
    cta: "Complete quiz",
  },
};

export const AdminLessonCompletionCallout = ({
  postTypeSlug,
  postId,
  pluginName,
  isNewRecord,
}: PluginSingleViewSlotProps) => {
  const config = LABEL_MAP[postTypeSlug];
  if (!config) {
    return null;
  }

  const handleComplete = () => {
    // Placeholder for future Convex mutation integration
    // eslint-disable-next-line no-console
    console.log(
      `[${pluginName}] Marking ${config.noun} complete`,
      postId ?? "new record",
    );
  };

  return (
    <div className="bg-card/60 rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="tracking-wide uppercase">
              LMS
            </Badge>
            <span className="text-muted-foreground text-sm font-medium">
              Manual completion
            </span>
          </div>
          <p className="text-foreground text-sm">{config.description}</p>
        </div>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={!postId || isNewRecord}
          className="whitespace-nowrap"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {config.cta}
        </Button>
      </div>
      {!postId || isNewRecord ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Save this entry once before recording completion.
        </p>
      ) : null}
    </div>
  );
};
