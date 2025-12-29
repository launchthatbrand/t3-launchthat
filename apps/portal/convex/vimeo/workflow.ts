/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { workflow } from "../workflow";

const workflowAny = workflow as any;
const internalAny = internal as any;

export const vimeoSyncWorkflow = workflowAny.define({
  args: {
    connectionId: v.id("connections"),
    // Optional cap to avoid long-running backstops across many orgs.
    // If set, we'll process up to `maxPages` pages and then pause (status=idle)
    // with `nextPage` advanced so a future run can resume.
    maxPages: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (step: any, args: any): Promise<null> => {
    // Use deterministic loop: all non-determinism happens in called actions/mutations.
    let processedPages = 0;
    while (true) {
      const state = await step.runQuery(
        internalAny.vimeo.syncState.getSyncStateByConnection,
        { connectionId: args.connectionId },
      );

      const nextPage = state?.nextPage ?? 1;
      const perPage = state?.perPage ?? 100;

      let pageResult: any;
      try {
        pageResult = await step.runAction(
          internalAny.vimeo.actions.fetchVimeoVideosPage,
          {
            connectionId: args.connectionId,
            page: nextPage,
            perPage,
          },
          // Vimeo can return deterministic errors for out-of-range pages; we handle those in the action.
          // Avoid workflow-level retry loops for non-transient errors.
          { retry: false },
        );
      } catch (error: unknown) {
        await step.runMutation(internalAny.vimeo.syncState.updateSyncState, {
          connectionId: args.connectionId,
          status: "error",
          lastError: error instanceof Error ? error.message : "Sync failed",
          finishedAt: Date.now(),
        });
        break;
      }

      if (typeof pageResult?.total === "number" && pageResult.total >= 0) {
        const estimatedTotalPages = Math.max(
          1,
          Math.ceil(pageResult.total / Math.max(perPage, 1)),
        );
        await step.runMutation(internalAny.vimeo.syncState.updateSyncState, {
          connectionId: args.connectionId,
          totalVideos: pageResult.total,
          estimatedTotalPages,
        });
      }

      if (pageResult.videos.length === 0) {
        await step.runMutation(internalAny.vimeo.syncState.updateSyncState, {
          connectionId: args.connectionId,
          status: "done",
          finishedAt: Date.now(),
        });
        break;
      }

      await step.runMutation(internalAny.vimeo.mutations.upsertVideosPage, {
        connectionId: args.connectionId,
        videos: pageResult.videos,
        now: Date.now(),
      });

      await step.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        status: "running",
        nextPage: nextPage + 1,
        pagesFetchedDelta: 1,
        syncedCountDelta: pageResult.videos.length,
        lastError: null,
      });

      processedPages += 1;
      if (args.maxPages !== undefined && processedPages >= args.maxPages) {
        await step.runMutation(internalAny.vimeo.syncState.updateSyncState, {
          connectionId: args.connectionId,
          status: "idle",
          finishedAt: Date.now(),
        });
        break;
      }
    }

    return null;
  },
});
