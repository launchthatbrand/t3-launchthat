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
  },
  returns: v.null(),
  handler: async (step: any, args: any): Promise<null> => {
    // Use deterministic loop: all non-determinism happens in called actions/mutations.
    while (true) {
      const state = await step.runQuery(
        internalAny.vimeo.syncState.getSyncStateByConnection,
        { connectionId: args.connectionId },
      );

      const nextPage = state?.nextPage ?? 1;
      const perPage = state?.perPage ?? 100;

      const pageResult = await step.runAction(
        internalAny.vimeo.actions.fetchVimeoVideosPage,
        {
          connectionId: args.connectionId,
          page: nextPage,
          perPage,
        },
        { retry: true },
      );

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
    }

    return null;
  },
});
