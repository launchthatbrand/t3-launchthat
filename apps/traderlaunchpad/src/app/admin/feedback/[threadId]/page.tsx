"use client";

import * as React from "react";

import { Button } from "@acme/ui/button";
import type { FeedbackAdapter } from "launchthat-plugin-feedback/frontend";
import {
  FeedbackThreadScreen
} from "launchthat-plugin-feedback/frontend";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";

export default function AdminFeedbackThreadPage() {
  const params = useParams<{ threadId?: string | string[] }>();
  const raw = params.threadId;
  const threadId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const adapter: FeedbackAdapter = React.useMemo(
    () => ({
      api: {
        queries: {
          listThreads: api.feedback.queries.listThreads,
          getThread: api.feedback.queries.getThread,
          listComments: api.feedback.queries.listComments,
        },
        mutations: {
          createThread: api.feedback.mutations.createThread,
          toggleUpvote: api.feedback.mutations.toggleUpvote,
          addComment: api.feedback.mutations.addComment,
        },
      },
    }),
    [],
  );

  if (!threadId) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="text-sm text-white/60">Missing thread id.</div>
      </div>
    );
  }

  return (
    <FeedbackThreadScreen
      adapter={adapter}
      threadId={threadId}
      headerLeftSlot={
        <Button asChild variant="outline">
          <Link href="/admin/feedback">Back</Link>
        </Button>
      }
    />
  );
}

