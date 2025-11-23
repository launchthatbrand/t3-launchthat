"use client";

import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { useState, useTransition } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { Switch } from "@acme/ui/switch";
import { toast } from "sonner";

export const LmsPermalinksSettings = ({
  pluginName,
}: PluginSettingComponentProps) => {
  const [isSaving, startTransition] = useTransition();
  const [structure, setStructure] = useState<"course" | "course-lesson">(
    "course",
  );
  const [courseBase, setCourseBase] = useState("courses");
  const [lessonBase, setLessonBase] = useState("lessons");
  const [appendTrailingSlash, setAppendTrailingSlash] = useState(true);

  const handleSubmit = () => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success(`${pluginName} permalinks saved`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base">Permalink structure</Label>
          <RadioGroup
            value={structure}
            onValueChange={(value) =>
              setStructure(value as "course" | "course-lesson")
            }
            className="grid gap-3"
          >
            <div className="flex items-center gap-3 rounded-md border px-4 py-3">
              <RadioGroupItem value="course" id="structure-course" />
              <div>
                <Label htmlFor="structure-course" className="cursor-pointer">
                  Course only
                </Label>
                <p className="text-sm text-muted-foreground">
                  /courses/course-name
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border px-4 py-3">
              <RadioGroupItem value="course-lesson" id="structure-lesson" />
              <div>
                <Label htmlFor="structure-lesson" className="cursor-pointer">
                  Course + lesson
                </Label>
                <p className="text-sm text-muted-foreground">
                  /courses/course-name/lessons/lesson-name
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="course-base">Course base</Label>
            <Input
              id="course-base"
              value={courseBase}
              onChange={(event) => setCourseBase(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-base">Lesson base</Label>
            <Input
              id="lesson-base"
              value={lessonBase}
              onChange={(event) => setLessonBase(event.target.value)}
              disabled={structure === "course"}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <Label className="text-base">Append trailing slash</Label>
            <p className="text-sm text-muted-foreground">
              Adds / to the end of course URLs.
            </p>
          </div>
          <Switch
            checked={appendTrailingSlash}
            onCheckedChange={setAppendTrailingSlash}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
};

