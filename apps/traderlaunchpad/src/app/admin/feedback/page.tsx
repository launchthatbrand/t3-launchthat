"use client";

import * as React from "react";

import { api } from "@convex-config/_generated/api";
import { FeedbackBoard, type FeedbackAdapter } from "launchthat-plugin-feedback/frontend";

export default function AdminFeedbackPage() {
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

  return <FeedbackBoard adapter={adapter} />;
}

