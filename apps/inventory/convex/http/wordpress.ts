import { httpRouter } from "convex/server";

import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

/**
 * WordPress webhook handler
 */
const http = httpRouter();

/**
 * Handler for WordPress webhooks
 *
 * This endpoint receives webhooks from WordPress and triggers rules in the rules engine.
 */
http.route({
  path: "/wordpress/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get the request body as JSON
      const payload = await request.json();

      // Verify the webhook signature if available
      // This would be a security check in a real implementation
      // const signature = request.headers.get("x-wp-signature");
      // if (!verifySignature(payload, signature)) {
      //   return new Response("Invalid signature", { status: 401 });
      // }

      // Determine trigger type based on WordPress event
      let triggerType = null;
      if (
        payload.action === "publish_post" ||
        payload.action === "publish_page"
      ) {
        triggerType = "wordpress.post_published";
      } else if (payload.action === "user_register") {
        triggerType = "wordpress.user_registered";
      } else if (payload.action === "comment_post") {
        triggerType = "wordpress.comment_posted";
      }

      if (!triggerType) {
        return new Response("Unknown event type", { status: 400 });
      }

      // Log the received webhook
      ctx.log("Received WordPress webhook", {
        triggerType,
        action: payload.action,
      });

      // Process the trigger
      await ctx.runMutation(internal.rules.processTrigger, {
        integrationId: "wordpress",
        triggerType,
        triggerData: payload,
      });

      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      // Log the error
      ctx.log("Error processing WordPress webhook", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return an error response
      return new Response(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 500 },
      );
    }
  }),
});

export default http;
