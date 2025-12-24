import type { Id } from "@/convex/_generated/dataModel";
import React from "react";

import { addFilter } from "@acme/admin-runtime/hooks";

import type { PluginFrontendSingleSlotRegistration } from "../plugins/helpers";
import { DownloadButton } from "~/components/downloads/DownloadButton";
import { env } from "~/env";
import { FRONTEND_SINGLE_SLOTS_FILTER } from "../plugins/hookSlots";

const hookName = FRONTEND_SINGLE_SLOTS_FILTER as unknown as string;

/**
 * Portal-core registrations for frontend single slots.
 *
 * This is intentionally separate from pluginDefinitions so core code can use the
 * same slot system without being forced into a plugin boundary.
 */
const registerCoreFrontendSlots = () => {
  addFilter(
    hookName,
    (value: unknown, ctx?: unknown) => {
      const slots: PluginFrontendSingleSlotRegistration[] = Array.isArray(value)
        ? (value as PluginFrontendSingleSlotRegistration[])
        : [];
      const postTypeSlug =
        ctx && typeof ctx === "object" && "postTypeSlug" in ctx
          ? (ctx as { postTypeSlug?: unknown }).postTypeSlug
          : undefined;
      if (typeof postTypeSlug !== "string") {
        return slots;
      }

      if (postTypeSlug.toLowerCase() !== "downloads") {
        return slots;
      }

      if (env.NODE_ENV !== "production") {
        console.log("[frontend.single.slots] core filter hit", {
          postTypeSlug,
          incomingSlotsCount: slots.length,
        });
      }

      const downloadButtonSlot: PluginFrontendSingleSlotRegistration = {
        pluginId: "core",
        pluginName: "Core",
        slot: {
          id: "core-downloads-download-button",
          location: "afterContent",
          render: (args: unknown) => {
            const postId =
              args && typeof args === "object" && "post" in args
                ? (args as { post?: { _id?: unknown } }).post?._id
                : undefined;
            if (typeof postId !== "string") {
              return null;
            }

            // Expected synthetic id: custom:downloads:{rawId}
            const parts = postId.split(":");
            const rawId = parts.length >= 3 ? parts.slice(2).join(":") : "";
            if (!/^[a-z0-9]{32}$/.test(rawId)) {
              if (env.NODE_ENV !== "production") {
                console.log(
                  "[frontend.single.slots] downloads slot render: invalid rawId",
                  { postId, rawId },
                );
              }
              return null;
            }

            if (env.NODE_ENV !== "production") {
              console.log("[frontend.single.slots] downloads slot render ok", {
                postId,
                rawId,
              });
            }

            return React.createElement(
              "div",
              { className: "rounded-lg border bg-card p-4" },
              React.createElement(
                "div",
                { className: "flex items-center justify-between gap-4" },
                React.createElement(
                  "div",
                  { className: "text-sm" },
                  React.createElement(
                    "div",
                    { className: "font-medium" },
                    "Download this file",
                  ),
                  React.createElement(
                    "div",
                    { className: "text-muted-foreground" },
                    "This link is time-limited.",
                  ),
                ),
                React.createElement(DownloadButton, {
                  downloadId: rawId as unknown as Id<"downloads">,
                }),
              ),
            );
          },
        },
      };

      return [...slots, downloadButtonSlot];
    },
    10,
    2,
  );
};

registerCoreFrontendSlots();
