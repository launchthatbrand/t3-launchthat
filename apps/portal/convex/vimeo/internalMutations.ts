/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v } from "convex/values";

import { components } from "../_generated/api";
import { internalMutation } from "../_generated/server";

const vAny = v as any;
const internalMutationAny = internalMutation as any;
const componentsAny = components as any;

export const deleteVimeoDataForConnection = internalMutationAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    await ctx.runMutation(
      componentsAny.launchthat_vimeo.internalMutations.deleteVimeoDataForConnection,
      { connectionId: String(args.connectionId) },
    );
    return null;
  },
});


