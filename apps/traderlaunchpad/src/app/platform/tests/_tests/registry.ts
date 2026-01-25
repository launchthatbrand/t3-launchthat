import { z } from "zod";

import type { PlatformTestDefinition } from "./types";

const orgIdSchema = z.string().min(1, "Organization id is required");
const guildIdSchema = z.string().min(1, "Guild id is required");
const symbolSchema = z
  .string()
  .min(1, "Symbol is required")
  .transform((s) => s.trim().toUpperCase());

export const platformTests = [
  {
    id: "png.snapshot.preview",
    category: "PNG",
    title: "PNG Snapshot Preview",
    description: "Generate and preview the BTCUSD-style community snapshot PNG.",
    dangerLevel: "safe",
    paramSchema: z.object({
      symbol: symbolSchema.default("BTCUSD"),
      maxUsers: z.number().int().min(1).max(500).default(100),
    }),
    defaults: {
      symbol: "BTCUSD",
      maxUsers: 100,
    },
  },
  {
    id: "png.snapshot.send_discord",
    category: "Discord",
    title: "Send Snapshot to Discord",
    description: "Generate PNG and POST/PATCH the org+symbol snapshot message to Discord.",
    dangerLevel: "guarded",
    paramSchema: z.object({
      organizationId: orgIdSchema,
      guildId: guildIdSchema,
      symbol: symbolSchema.default("BTCUSD"),
    }),
    defaults: {
      organizationId: "",
      guildId: "",
      symbol: "BTCUSD",
    },
  },
  {
    id: "discord.broadcast",
    category: "Discord",
    title: "Discord Broadcast (dangerous)",
    description:
      "Send a message to all orgs/guilds (start with a single-org scope; expand later).",
    dangerLevel: "dangerous",
    paramSchema: z.object({
      organizationId: orgIdSchema,
      message: z.string().min(1, "Message is required"),
    }),
    defaults: {
      organizationId: "",
      message: "🧪 Platform test broadcast",
    },
  },
  {
    id: "email.send",
    category: "Email",
    title: "Send Test Email",
    description: "Send a test email to a target address.",
    dangerLevel: "guarded",
    paramSchema: z.object({
      toEmail: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
    defaults: {
      toEmail: "",
      subject: "🧪 Platform test email",
      body: "Hello from /platform/tests",
    },
  },
] satisfies PlatformTestDefinition<any>[];

export type PlatformTestId = (typeof platformTests)[number]["id"];

export const byTestId = (id: string) =>
  platformTests.find((t) => t.id === id) ?? null;

