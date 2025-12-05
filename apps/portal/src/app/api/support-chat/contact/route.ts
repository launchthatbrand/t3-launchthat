"use server";

import type { Id } from "@/convex/_generated/dataModel";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

import { getConvex } from "~/lib/convex";

const contactSchema = z.object({
  organizationId: z.string(),
  sessionId: z.string().optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json());
    const convex = getConvex();
    const contactId = await convex.mutation(
      api.core.crm.contacts.mutations.upsert,
      {
        organizationId: payload.organizationId as Id<"organizations">,
        email: payload.email,
        phone: payload.phone,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: payload.fullName,
        company: payload.company,
      },
    );

    return NextResponse.json({
      contactId,
      contact: {
        contactId,
        fullName:
          payload.fullName ??
          [payload.firstName, payload.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
        email: payload.email,
      },
    });
  } catch (error) {
    console.error("[support-chat][contact] failed", error);
    return NextResponse.json(
      { error: "Unable to capture contact" },
      { status: 400 },
    );
  }
}
