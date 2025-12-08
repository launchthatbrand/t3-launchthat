"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  LMS_QUIZ_ASSISTANT_EXPERIENCE_ID,
  openSupportAssistantExperience,
} from "launchthat-plugin-support/assistant";
import { Copy, Download, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { AdminMetaBoxContext } from "../types";
import type { RegisteredMetaBox } from "./registry";
import { registerMetaBoxHook } from "./registry";

const formatTimestamp = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
};

const VimeoTranscriptMetaBox = ({
  context,
}: {
  context: AdminMetaBoxContext;
}) => {
  const postId = context.post?._id;
  const organizationId: Id<"organizations"> | null =
    context.organizationId ??
    (context.post?.organizationId as Id<"organizations"> | undefined) ??
    null;

  const postMetaMap = context.customFields?.postMetaMap ?? {};
  const videoIdRaw = postMetaMap.vimeoVideoId;
  const videoId =
    typeof videoIdRaw === "string" && videoIdRaw.trim().length > 0
      ? videoIdRaw.trim()
      : null;

  if (!videoId || !postId) {
    return null;
  }

  const ownerId = organizationId;

  const vimeoOption = useQuery(
    api.core.options.get,
    ownerId
      ? ({
          orgId: ownerId,
          type: "site",
          metaKey: "plugin_vimeo_enabled",
        } as const)
      : "skip",
  );
  const isVimeoEnabled = Boolean(vimeoOption?.metaValue);

  const fetchTranscript = useAction(api.vimeo.actions.fetchTranscript);
  const updatePost = useMutation(api.core.posts.mutations.updatePost);

  const transcript =
    typeof postMetaMap.vimeoTranscript === "string"
      ? postMetaMap.vimeoTranscript
      : "";
  const rawTranscriptVtt =
    typeof postMetaMap.vimeoTranscriptVtt === "string"
      ? postMetaMap.vimeoTranscriptVtt
      : "";
  const transcriptLanguage =
    typeof postMetaMap.vimeoTranscriptLanguage === "string"
      ? postMetaMap.vimeoTranscriptLanguage
      : "";
  const transcriptTrackLabel =
    typeof postMetaMap.vimeoTranscriptTrackLabel === "string"
      ? postMetaMap.vimeoTranscriptTrackLabel
      : "";
  const transcriptFetchedAt =
    typeof postMetaMap.vimeoTranscriptLastFetchedAt === "number"
      ? postMetaMap.vimeoTranscriptLastFetchedAt
      : null;

  const embedUrlValue = postMetaMap.vimeoEmbedUrl;
  const embedUrl =
    typeof embedUrlValue === "string" && embedUrlValue.length > 0
      ? embedUrlValue
      : `https://vimeo.com/${videoId}`;

  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastFetchedLabel = useMemo(
    () => formatTimestamp(transcriptFetchedAt),
    [transcriptFetchedAt],
  );

  const handleFetchTranscript = useCallback(async () => {
    if (!ownerId) {
      setErrorMessage(
        "No organization context available. Switch to an organization to fetch transcripts.",
      );
      return;
    }
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const result = await fetchTranscript({
        ownerId,
        videoId,
      });
      await updatePost({
        id: postId,
        meta: {
          vimeoTranscript: result.transcript,
          vimeoTranscriptVtt: result.rawVtt,
          vimeoTranscriptLanguage: result.track.language ?? "",
          vimeoTranscriptTrackLabel: result.track.label ?? "",
          vimeoTranscriptLastFetchedAt: Date.now(),
        },
      });
      toast("Transcript saved", {
        description: "The latest subtitles were fetched from Vimeo.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fetch transcript.",
      );
    } finally {
      setIsFetching(false);
    }
  }, [fetchTranscript, ownerId, postId, updatePost, videoId]);

  const handleCopyTranscript = useCallback(async () => {
    if (!transcript) return;
    try {
      await navigator.clipboard.writeText(transcript);
      toast("Transcript copied");
    } catch (error) {
      toast("Copy failed", {
        description:
          error instanceof Error ? error.message : "Unable to copy transcript.",
      });
    }
  }, [transcript]);

  const handleCopyVtt = useCallback(async () => {
    if (!rawTranscriptVtt) return;
    try {
      await navigator.clipboard.writeText(rawTranscriptVtt);
      toast("VTT copied");
    } catch (error) {
      toast("Copy failed", {
        description:
          error instanceof Error ? error.message : "Unable to copy VTT.",
      });
    }
  }, [rawTranscriptVtt]);

  const handleLaunchQuizAssistant = useCallback(() => {
    if (!postId || !ownerId) {
      return;
    }
    openSupportAssistantExperience({
      experienceId: LMS_QUIZ_ASSISTANT_EXPERIENCE_ID,
      context: {
        lessonId: postId,
        organizationId: ownerId,
        lessonTitle: context.post?.title ?? undefined,
      },
    });
  }, [context.post?.title, ownerId, postId]);

  if (vimeoOption !== undefined && !isVimeoEnabled) {
    return null;
  }

  if (ownerId && vimeoOption === undefined) {
    return (
      <p className="text-muted-foreground text-sm">
        Checking Vimeo connection status&hellip;
      </p>
    );
  }

  if (!ownerId) {
    return (
      <Alert>
        <AlertTitle>Organization context required</AlertTitle>
        <AlertDescription>
          Switch to an organization to access its Vimeo connection and fetch
          subtitles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-muted-foreground font-mono text-sm">
          Video ID: {videoId}
        </p>
        <Button asChild variant="link" className="h-auto p-0 text-xs">
          <Link href={embedUrl} target="_blank" rel="noreferrer">
            View video on Vimeo
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleFetchTranscript}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching subtitles...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Fetch subtitles from Vimeo
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyTranscript}
          disabled={!transcript}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy transcript
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyVtt}
          disabled={!rawTranscriptVtt}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy raw VTT
        </Button>
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to fetch transcript</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Latest transcript</span>
          {transcriptTrackLabel ? (
            <Badge variant="secondary">{transcriptTrackLabel}</Badge>
          ) : null}
          {transcriptLanguage ? (
            <Badge variant="outline">{transcriptLanguage.toUpperCase()}</Badge>
          ) : null}
          {lastFetchedLabel ? (
            <span className="text-muted-foreground text-xs">
              Updated {lastFetchedLabel}
            </span>
          ) : null}
        </div>
        {transcript ? (
          <ScrollArea className="h-[200px]">
            <Textarea
              value={transcript}
              readOnly
              rows={8}
              className="text-sm"
            />
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-sm">
            No transcript has been fetched yet. Use the button above to pull the
            latest captions from Vimeo.
          </p>
        )}
        {rawTranscriptVtt ? (
          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Raw VTT payload
            </summary>
            <Textarea
              value={rawTranscriptVtt}
              readOnly
              rows={8}
              className="mt-3 font-mono text-xs"
            />
          </details>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleLaunchQuizAssistant}
          disabled={!transcript || !ownerId || !postId}
        >
          Generate quiz for this lesson
        </Button>
      </div>
    </div>
  );
};

const registerVimeoMetaBox = () =>
  registerMetaBoxHook("sidebar", (context): RegisteredMetaBox | null => {
    const postMetaMap = context.customFields?.postMetaMap ?? {};
    const videoId = postMetaMap.vimeoVideoId;
    const hasVideoId = typeof videoId === "string" && videoId.trim().length > 0;
    if (!hasVideoId) {
      return null;
    }

    return {
      id: "vimeo-transcript",
      title: "Vimeo Transcript",
      description:
        "Fetch subtitle tracks from Vimeo to power quiz generation and accessibility tooling.",
      location: "sidebar",
      priority: 45,
      render: () => <VimeoTranscriptMetaBox context={context} />,
    };
  });

registerVimeoMetaBox();
