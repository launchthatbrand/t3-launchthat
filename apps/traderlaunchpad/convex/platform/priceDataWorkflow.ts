/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow } from "../workflow";

const workflowAny = workflow as any;
const internalAny = internal as any;

export const backfillPriceData1mWorkflow = workflowAny.define({
  args: {
    jobId: v.id("platformPriceDataJobs"),
  },
  returns: v.null(),
  handler: async (step: any, args: any): Promise<null> => {
    // Compute the missing window to fetch (incremental backfill).
    const window = await step.runAction(
      internalAny.platform.priceDataJobsInternalActions.computeAndStoreBackfillWindow1m,
      { jobId: args.jobId },
      { retry: false },
    );

    if (!window?.ok) {
      await step.runMutation(internalAny.platform.priceDataJobsInternalMutations.markJobError, {
        jobId: args.jobId,
        error: String(window?.error ?? "Failed to compute backfill window"),
      });
      return null;
    }

    const fromMs = Number(window.fromMs ?? NaN);
    const toMs = Number(window.toMs ?? NaN);

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
      await step.runMutation(internalAny.platform.priceDataJobsInternalMutations.markJobDone, {
        jobId: args.jobId,
      });
      return null;
    }

    // Deterministic chunking: time windows in fixed-size slices.
    const chunkDays = 3;
    const chunkMs = chunkDays * 24 * 60 * 60 * 1000;
    const totalChunks = Math.max(1, Math.ceil((toMs - fromMs) / chunkMs));

    let chunkIndex = 0;
    for (let cursor = fromMs; cursor < toMs; cursor += chunkMs) {
      const chunkFromMs = cursor;
      const chunkToMs = Math.min(toMs, cursor + chunkMs);

      const chunkRes = await step.runAction(
        internalAny.platform.priceDataJobsInternalActions.fetchAndInsertTradeLockerHistoryChunk1m,
        { jobId: args.jobId, fromMs: chunkFromMs, toMs: chunkToMs },
      );

      chunkIndex += 1;
      await step.runMutation(internalAny.platform.priceDataJobsInternalMutations.updateJobProgress, {
        jobId: args.jobId,
        progress: {
          ...(chunkRes?.progress ?? {}),
          chunksDone: chunkIndex,
          chunksTotal: totalChunks,
          lastChunkFromMs: chunkFromMs,
          lastChunkToMs: chunkToMs,
        },
      });

      if (!chunkRes?.ok) {
        await step.runMutation(internalAny.platform.priceDataJobsInternalMutations.markJobError, {
          jobId: args.jobId,
          error: String(chunkRes?.error ?? "Backfill chunk failed"),
        });
        return null;
      }
    }

    await step.runMutation(internalAny.platform.priceDataJobsInternalMutations.markJobDone, {
      jobId: args.jobId,
    });

    return null;
  },
});

