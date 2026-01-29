import Stripe from "stripe";
import { v } from "convex/values";
import { action } from "./_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("./_generated/api").internal;

const createStripeClient = (secretKey: string): Stripe => {
  return new Stripe(secretKey, {
    apiVersion: "2025-04-30.basil",
  });
};

export const processEvent = action({
  args: {
    stripeSecretKey: v.string(),
    stripeWebhookSecret: v.string(),
    signature: v.string(),
    rawBody: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    handled: v.boolean(),
    kind: v.union(v.string(), v.null()),
    externalEventId: v.union(v.string(), v.null()),
    userId: v.union(v.string(), v.null()),
    amountCents: v.union(v.number(), v.null()),
    currency: v.union(v.string(), v.null()),
    occurredAt: v.union(v.number(), v.null()),
    error: v.union(v.string(), v.null()),
  }),
  handler: async (ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    const webhookSecret = String(args.stripeWebhookSecret ?? "").trim();
    const signature = String(args.signature ?? "").trim();
    const rawBody = String(args.rawBody ?? "");
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    if (!webhookSecret) throw new Error("Missing stripeWebhookSecret");
    if (!signature) throw new Error("Missing signature");

    const stripe = createStripeClient(secretKey);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      return {
        ok: false,
        handled: false,
        kind: null,
        externalEventId: null,
        userId: null,
        amountCents: null,
        currency: null,
        occurredAt: null,
        error: String(err?.message ?? err),
      };
    }

    // Normalize a small set of payment events for affiliate credit.
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      let userId: string | null = customerId
        ? await ctx.runQuery(internalUntyped.getUserIdForStripeCustomerId, { customerId })
        : null;
      if (!userId && customerId) {
        // Fallback: look for `metadata.userId` on the Stripe customer and cache it.
        try {
          const customer = await stripe.customers.retrieve(customerId);
          const metaUserId =
            customer &&
            typeof customer === "object" &&
            "metadata" in customer &&
            (customer as any).metadata &&
            typeof (customer as any).metadata.userId === "string"
              ? String((customer as any).metadata.userId).trim()
              : "";
          if (metaUserId) {
            userId = metaUserId;
            await ctx.runMutation(internalUntyped.upsertStripeCustomerForUser, {
              userId: metaUserId,
              customerId,
            });
          }
        } catch {
          // Best-effort
        }
      }

      const amountCents =
        typeof invoice.amount_paid === "number" ? invoice.amount_paid : null;
      const currency = typeof invoice.currency === "string" ? invoice.currency.toUpperCase() : null;
      const externalEventId = typeof invoice.id === "string" ? invoice.id : event.id;

      return {
        ok: true,
        handled: true,
        kind: "invoice.paid",
        externalEventId,
        userId,
        amountCents,
        currency,
        occurredAt: typeof invoice.created === "number" ? invoice.created * 1000 : Date.now(),
        error: null,
      };
    }

    return {
      ok: true,
      handled: false,
      kind: event.type,
      externalEventId: event.id,
      userId: null,
      amountCents: null,
      currency: null,
      occurredAt: null,
      error: null,
    };
  },
});

