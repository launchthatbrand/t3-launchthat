"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@portal/convexspec";
import { useAction, useQuery } from "convex/react";
import { Konva } from "@acme/konva";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";
import { toast } from "@acme/ui/toast";

import { CertificateCanvas } from "../components/certificates/CertificateCanvas";
import type {
  CertificatePlaceholderKey,
  CertificateTemplateV1,
} from "../components/certificates/types";
import { DEFAULT_TEMPLATE, resolveCanvasSizePx } from "../components/certificates/types";
import type { Id } from "../lib/convexId";

const TEMPLATE_META_KEY = "certificateTemplate";

const safeParseTemplate = (value: unknown): CertificateTemplateV1 | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(value) as CertificateTemplateV1;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
};

const buildMetaMap = (entries: any[] | null | undefined) => {
  const map = new Map<string, any>();
  (entries ?? []).forEach((entry) => {
    if (entry?.key) {
      map.set(String(entry.key), entry.value);
    }
  });
  return map;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const CertificateViewer = ({
  certificateId,
  certificateSlug,
  organizationId,
}: {
  certificateId: Id<"posts">;
  certificateSlug?: string;
  organizationId?: Id<"organizations">;
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [preferredCourseSlug, setPreferredCourseSlug] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const parts = path.split("/").filter(Boolean);
    if (parts[0]?.toLowerCase() !== "course") return;
    const courseSlug = parts[1]?.trim();
    if (courseSlug) {
      setPreferredCourseSlug(courseSlug);
    }
  }, []);

  const postMeta = useQuery(
    (api.plugins.lms.posts.queries as any).getPostMeta,
    certificateId
      ? {
          postId: certificateId as unknown as string,
          organizationId: organizationId as unknown as string | undefined,
        }
      : "skip",
  ) as any[] | undefined;
  const isTemplateLoading = postMeta === undefined;

  const metaMap = useMemo(() => buildMetaMap(postMeta), [postMeta]);
  const template = useMemo(() => {
    const raw = metaMap.get(TEMPLATE_META_KEY);
    return safeParseTemplate(raw) ?? DEFAULT_TEMPLATE;
  }, [metaMap]);

  const eligible = useQuery(
    api.plugins.lms.queries.listCompletedCoursesForCertificateViewer,
    certificateId
      ? {
          certificateId: certificateId as unknown as string,
          organizationId: organizationId as unknown as Id<"organizations"> | undefined,
        }
      : "skip",
  );

  const isEligibleLoading = eligible === undefined;
  const isUnauthed = eligible === null;
  const eligibleCourses = (eligible ?? []) as Array<{
    courseId: string;
    courseSlug?: string;
    courseTitle: string;
    completedAt: number;
  }>;

  useEffect(() => {
    if (isEligibleLoading || isUnauthed) return;
    if (eligibleCourses.length === 0) return;

    // If we're rendering under a `/course/:courseSlug/.../certificate/...` URL, prefer
    // that course as the personalization source.
    if (preferredCourseSlug) {
      const match = eligibleCourses.find(
        (course) =>
          typeof course.courseSlug === "string" &&
          course.courseSlug.toLowerCase() === preferredCourseSlug.toLowerCase(),
      );
      if (match) {
        setSelectedCourseId(match.courseId);
        return;
      }
    }

    if (eligibleCourses.length === 1) {
      setSelectedCourseId(eligibleCourses[0]?.courseId ?? null);
      return;
    }

    // Default to most-recent completion (or first item for admin previews).
    setSelectedCourseId((prev) => prev ?? eligibleCourses[0]?.courseId ?? null);
  }, [eligibleCourses, isEligibleLoading, isUnauthed, preferredCourseSlug]);

  const viewerContext = useQuery(
    api.plugins.lms.queries.getCertificateViewerContext,
    selectedCourseId
      ? {
          certificateId: certificateId as unknown as string,
          courseId: selectedCourseId,
          organizationId: organizationId as unknown as Id<"organizations"> | undefined,
        }
      : "skip",
  );

  const isContextLoading = selectedCourseId ? viewerContext === undefined : false;

  const placeholderValues = useMemo(() => {
    if (!viewerContext) return undefined;
    return {
      userName: viewerContext.userName,
      completionDate: viewerContext.completionDate,
      courseTitle: viewerContext.courseTitle,
      certificateId: viewerContext.certificateId,
      organizationName: viewerContext.organizationName ?? "",
    } satisfies Partial<Record<CertificatePlaceholderKey, string>>;
  }, [viewerContext]);

  const mediaQuery = useQuery(api.core.media.queries.listMediaItemsWithUrl, {
    paginationOpts: { numItems: 500, cursor: null },
  }) as any;
  const isMediaLoading = mediaQuery === undefined;
  const mediaItems = (mediaQuery?.page ?? []) as any[];

  const imageUrlByStorageId = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of mediaItems) {
      const storageId = item?.storageId;
      if (!storageId) continue;
      map.set(String(storageId), item);
    }
    return map;
  }, [mediaItems]);

  const generateCertificatePdf = useAction(
    (api.plugins.lms.actions as any).generateCertificatePdf,
  );

  const handleDownloadPdf = useCallback(async () => {
    if (!viewerContext) return;
    try {
      const bytes = (await generateCertificatePdf({
        certificateId: certificateId as unknown as string,
        organizationId: organizationId as unknown as string | undefined,
        context: viewerContext,
      })) as ArrayBuffer;

      downloadBlob(
        new Blob([bytes], { type: "application/pdf" }),
        `${certificateSlug ?? "certificate"}-${selectedCourseId ?? "download"}.pdf`,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PDF.",
      );
    }
  }, [
    certificateId,
    certificateSlug,
    generateCertificatePdf,
    organizationId,
    selectedCourseId,
    viewerContext,
  ]);

  const handleDownloadPng = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      const { width: docW, height: docH } = resolveCanvasSizePx(template.page);
      const prev = {
        width: stage.width(),
        height: stage.height(),
        scaleX: stage.scaleX(),
        scaleY: stage.scaleY(),
      };

      stage.width(docW);
      stage.height(docH);
      stage.scale({ x: 1, y: 1 });
      stage.draw();

      const dataUrl = stage.toDataURL({ pixelRatio: 2 });

      stage.width(prev.width);
      stage.height(prev.height);
      stage.scale({ x: prev.scaleX, y: prev.scaleY });
      stage.draw();

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      downloadBlob(
        blob,
        `${certificateSlug ?? "certificate"}-${selectedCourseId ?? "download"}.png`,
      );
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to export PNG.");
    }
  }, [certificateSlug, selectedCourseId, template.page]);

  if (isEligibleLoading) {
    return (
      <div className="container space-y-4 py-16">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (isUnauthed) {
    return (
      <div className="container py-16">
        <Card>
          <CardHeader>
            <CardTitle>Login required</CardTitle>
            <CardDescription>
              Please sign in to view and download your personalized certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/login">Sign in</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eligibleCourses.length === 0) {
    return (
      <div className="container py-16">
        <Card>
          <CardHeader>
            <CardTitle>No completion found</CardTitle>
            <CardDescription>
              No completed course was found for this certificate.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="from-muted/50 space-y-6 bg-linear-to-b via-transparent to-transparent py-10">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Certificate</h1>
            <p className="text-muted-foreground text-sm">
              Download your personalized certificate as PDF or PNG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!viewerContext || isContextLoading || isTemplateLoading || isMediaLoading}
              onClick={handleDownloadPng}
            >
              Download PNG
            </Button>
            <Button
              type="button"
              disabled={!viewerContext || isContextLoading}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Course</CardTitle>
            <CardDescription>
              Select which completion to use for personalization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eligibleCourses.length > 1 ? (
              <Select
                value={selectedCourseId ?? undefined}
                onValueChange={(v) => setSelectedCourseId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a completed course" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCourses.map((course) => (
                    <SelectItem key={course.courseId} value={course.courseId}>
                      {course.courseTitle} ·{" "}
                      {new Date(course.completedAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm">
                <div className="font-medium">{eligibleCourses[0]?.courseTitle}</div>
                <div className="text-muted-foreground">
                  Completed{" "}
                  {new Date(eligibleCourses[0]!.completedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {isContextLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : viewerContext ? (
              <div className="text-muted-foreground text-sm">
                Issued to <span className="text-foreground">{viewerContext.userName}</span>{" "}
                on{" "}
                <span className="text-foreground">
                  {new Date(viewerContext.completionDate).toLocaleDateString()}
                </span>
                .
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="text-muted-foreground text-sm">Preview</div>
          {isTemplateLoading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : (
            <CertificateCanvas
              template={template}
              imageUrlByStorageId={imageUrlByStorageId}
              interactive={false}
              showGrid={false}
              placeholderValues={placeholderValues}
              stageRef={stageRef as any}
            />
          )}
        </div>
      </div>
    </div>
  );
};


