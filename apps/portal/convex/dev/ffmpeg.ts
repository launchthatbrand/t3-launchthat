"use node";

import { spawn } from "node:child_process";
import { v } from "convex/values";
// `ffmpeg-static` is a binary path string. Types can vary across environments, so keep it permissive.
import ffmpegPathImport from "ffmpeg-static";

import { action } from "../_generated/server";

const ffmpegPath: string | null =
  typeof ffmpegPathImport === "string" && ffmpegPathImport.length > 0
    ? ffmpegPathImport
    : null;

const runProcess = async (cmd: string, args: string[]) => {
  return await new Promise<{ code: number | null; output: string }>(
    (resolve) => {
      const proc = spawn(cmd, args);
      let buf = "";
      proc.stdout.on("data", (d: Buffer) => (buf += d.toString()));
      proc.stderr.on("data", (d: Buffer) => (buf += d.toString()));
      proc.on("close", (code) => resolve({ code, output: buf }));
      proc.on("error", (err) => resolve({ code: -1, output: String(err) }));
    },
  );
};

export const ffmpegSmokeTest = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    ffmpegPath: v.union(v.string(), v.null()),
    exitCode: v.union(v.number(), v.null()),
    output: v.string(),
  }),
  handler: async () => {
    if (!ffmpegPath) {
      return {
        ok: false,
        ffmpegPath: null,
        exitCode: null,
        output: "ffmpeg-static did not provide a binary path.",
      };
    }

    const result = await runProcess(ffmpegPath, ["-version"]);
    const ok =
      typeof result.output === "string" &&
      result.output.toLowerCase().includes("ffmpeg version");

    return {
      ok,
      ffmpegPath,
      exitCode: result.code === null ? null : Number(result.code),
      output: result.output,
    };
  },
});
