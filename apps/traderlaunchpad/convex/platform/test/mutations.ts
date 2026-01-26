"use node";

import { action } from "../../_generated/server";
import { v } from "convex/values";
import {
  buildSnapshotPreview,
  fetchDiscordGuildChannelsForPlatformTestsImpl,
  previewDiscordBroadcast,
  previewSendEmail,
  requirePlatformAdmin,
  runDiscordBroadcast,
  runSendEmail,
  runSendSnapshotToDiscord,
} from "./helpers";

export const fetchDiscordGuildChannelsForPlatformTests = action({
  args: {
    guildId: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    guildId: v.string(),
    organizationId: v.optional(v.string()),
    guildName: v.optional(v.string()),
    channels: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.number(),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return await fetchDiscordGuildChannelsForPlatformTestsImpl(ctx, { guildId: args.guildId });
  },
});

export const previewTest = action({
  args: {
    testId: v.string(),
    params: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (args.testId === "png.snapshot.preview") {
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "png.snapshot.send_discord") {
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "email.send") {
      return previewSendEmail(args.params);
    }
    if (args.testId === "discord.broadcast") {
      return await previewDiscordBroadcast(ctx, args.params);
    }

    return { kind: "logs", logs: [`previewTest not implemented for ${args.testId}`] };
  },
});

export const runTest = action({
  args: {
    testId: v.string(),
    params: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (args.testId === "png.snapshot.preview") {
      // "Run" does not have side-effects for this test; mirror preview.
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "png.snapshot.send_discord") {
      return await runSendSnapshotToDiscord(ctx, args.params);
    }
    if (args.testId === "email.send") {
      return await runSendEmail(ctx, args.params);
    }
    if (args.testId === "discord.broadcast") {
      return await runDiscordBroadcast(ctx, args.params);
    }

    return { kind: "logs", logs: [`runTest not implemented for ${args.testId}`] };
  },
});

