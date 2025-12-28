import { v } from "convex/values";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

type SigningContext = {
  issueId: Id<"disclaimerIssues">;
  status: "incomplete" | "complete";
  recipientEmail: string;
  recipientName?: string;
  template: {
    consentText: string;
    pdfUrl: string;
    pdfVersion: number;
    postId: string;
    title: string;
    builderTemplateJson?: string;
  };
} | null;

type SubmitSignatureResult = {
  signatureId: Id<"disclaimerSignatures">;
  signedPdfFileId: Id<"_storage">;
};

const parseSignatureDataUrl = (dataUrl: string): Uint8Array => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!match) {
    throw new Error("Invalid signature data URL.");
  }
  const base64 = match[2] ?? "";
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const sha256HexFromBytes = async (bytes: Uint8Array): Promise<string> => {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const submitSignature = action({
  args: {
    issueId: v.id("disclaimerIssues"),
    tokenHash: v.string(),
    signatureDataUrl: v.optional(v.string()),
    fieldSignatures: v.optional(
      v.array(
        v.object({
          fieldId: v.string(),
          signatureDataUrl: v.string(),
        }),
      ),
    ),
    signedName: v.string(),
    signedEmail: v.string(),
    signedByUserId: v.optional(v.string()),
    consentText: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    signatureId: v.id("disclaimerSignatures"),
    signedPdfFileId: v.id("_storage"),
  }),
  handler: async (ctx, args): Promise<SubmitSignatureResult> => {
    const signing: SigningContext = await ctx.runQuery(
      api.queries.getSigningContext,
      {
        issueId: args.issueId,
        tokenHash: args.tokenHash,
      },
    );
    if (!signing) {
      throw new Error("Invalid token.");
    }
    if (signing.status !== "incomplete") {
      throw new Error("Issue is already complete.");
    }

    // Load original PDF.
    const pdfRes = await fetch(signing.template.pdfUrl);
    if (!pdfRes.ok) {
      throw new Error(`Failed to load PDF (${pdfRes.status}).`);
    }
    const originalBytes = new Uint8Array(await pdfRes.arrayBuffer());

    // Stamp signed section.
    const pdf = await PDFDocument.load(originalBytes);
    const pages = pdf.getPages();
    if (pages.length === 0) throw new Error("PDF has no pages.");

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // If multi-sign is provided, stamp each field on its configured page.
    // Otherwise, fallback to the legacy single-sign behavior (audit box on last page).
    const fieldSignatures =
      Array.isArray(args.fieldSignatures) && args.fieldSignatures.length > 0
        ? (args.fieldSignatures as Array<{ fieldId: string; signatureDataUrl: string }>)
        : null;

    let signaturePngFileId: Id<"_storage"> | undefined;

    if (fieldSignatures) {
      const rawBuilder =
        typeof signing.template.builderTemplateJson === "string"
          ? signing.template.builderTemplateJson
          : "";

      type BuilderField = {
        id: string;
        kind: "signature";
        pageIndex: number;
        xPct: number;
        yPct: number; // from top
        wPct: number;
        hPct: number;
        required: boolean;
        label?: string;
      };
      type BuilderTemplate = { version: 1; fields: BuilderField[] };

      let builder: BuilderTemplate | null = null;
      try {
        const parsed = JSON.parse(rawBuilder) as BuilderTemplate;
        if (parsed && parsed.version === 1 && Array.isArray(parsed.fields)) {
          builder = parsed;
        }
      } catch {
        builder = null;
      }

      const fields: BuilderField[] =
        builder?.fields?.filter((f) => f && f.kind === "signature") ?? [];

      if (fields.length === 0) {
        throw new Error("No builder signature fields configured for this template.");
      }

      const fieldById = new Map(fields.map((f) => [String(f.id), f]));

      for (const entry of fieldSignatures) {
        const field = fieldById.get(String(entry.fieldId));
        if (!field) {
          throw new Error("Unknown signature field.");
        }
        if (field.pageIndex < 0 || field.pageIndex >= pages.length) {
          throw new Error("Signature field page is out of range.");
        }
        const signatureBytes = parseSignatureDataUrl(entry.signatureDataUrl);
        const signaturePng = await pdf.embedPng(signatureBytes);

        if (!signaturePngFileId) {
          // Store the first signature image for audit/reference.
          const signatureAb = new ArrayBuffer(signatureBytes.byteLength);
          new Uint8Array(signatureAb).set(signatureBytes);
          const signatureBlob = new Blob([signatureAb], { type: "image/png" });
          signaturePngFileId = await ctx.storage.store(signatureBlob);
        }

        const page = pages[field.pageIndex]!;
        const { width: pageW, height: pageH } = page.getSize();
        const boxW = Math.max(1, Math.min(pageW, field.wPct * pageW));
        const boxH = Math.max(1, Math.min(pageH, field.hPct * pageH));
        const boxX = Math.max(0, Math.min(pageW - boxW, field.xPct * pageW));
        const boxYTop = Math.max(0, Math.min(pageH - boxH, field.yPct * pageH));
        const boxY = pageH - boxYTop - boxH;

        page.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          borderColor: rgb(0.2, 0.2, 0.2),
          borderWidth: 1,
          color: rgb(1, 1, 1),
          opacity: 0,
        });

        const imgDims = signaturePng.scale(1);
        const scale = Math.min(boxW / imgDims.width, boxH / imgDims.height, 1);
        const imgW = imgDims.width * scale;
        const imgH = imgDims.height * scale;

        page.drawImage(signaturePng, {
          x: boxX + (boxW - imgW) / 2,
          y: boxY + (boxH - imgH) / 2,
          width: imgW,
          height: imgH,
        });
      }
    } else {
      const legacySignatureDataUrl = typeof args.signatureDataUrl === "string" ? args.signatureDataUrl : "";
      if (!legacySignatureDataUrl) {
        throw new Error("Missing signature.");
      }

      const signatureBytes = parseSignatureDataUrl(legacySignatureDataUrl);

      // Store signature image.
      const signatureAb = new ArrayBuffer(signatureBytes.byteLength);
      new Uint8Array(signatureAb).set(signatureBytes);
      const signatureBlob = new Blob([signatureAb], { type: "image/png" });
      signaturePngFileId = await ctx.storage.store(signatureBlob);

      const page = pages[pages.length - 1]!;
      const signaturePng = await pdf.embedPng(signatureBytes);
      const signatureDims = signaturePng.scale(0.5);

      const { width } = page.getSize();
      const margin = 36;
      const boxWidth = Math.min(360, width - margin * 2);
      const boxHeight = 160;
      const boxX = width - margin - boxWidth;
      const boxY = margin;

      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      const titleY = boxY + boxHeight - 18;
      page.drawText("Signed acknowledgment", {
        x: boxX + 12,
        y: titleY,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      const signatureMaxWidth = boxWidth - 24;
      const signatureScale =
        signatureDims.width > signatureMaxWidth
          ? signatureMaxWidth / signatureDims.width
          : 1;
      const sigW = signatureDims.width * signatureScale;
      const sigH = signatureDims.height * signatureScale;

      const sigX = boxX + 12;
      const sigY = boxY + boxHeight - 18 - sigH - 12;
      page.drawImage(signaturePng, {
        x: sigX,
        y: sigY,
        width: sigW,
        height: sigH,
      });

      const lineY = sigY - 10;
      page.drawLine({
        start: { x: boxX + 12, y: lineY },
        end: { x: boxX + boxWidth - 12, y: lineY },
        thickness: 1,
        color: rgb(0.75, 0.75, 0.75),
      });

      const signedAtIso = new Date().toISOString();
      const textY = lineY - 14;
      const lines = [
        `Name: ${args.signedName}`,
        `Email: ${args.signedEmail}`,
        `Signed at: ${signedAtIso}`,
      ];
      lines.forEach((line, idx) => {
        page.drawText(line, {
          x: boxX + 12,
          y: textY - idx * 12,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
    }

    // Always embed consent as invisible text (audit).
    const lastPage = pages[pages.length - 1]!;
    lastPage.drawText(`Consent: ${args.consentText}`.slice(0, 500), {
      x: 0,
      y: 0,
      size: 1,
      font,
      color: rgb(1, 1, 1),
      opacity: 0,
    });

    const signedBytes = await pdf.save();
    const signedBlob = new Blob([signedBytes as unknown as BufferSource], {
      type: "application/pdf",
    });
    const signedPdfFileId = await ctx.storage.store(signedBlob);
    const pdfSha256 = await sha256HexFromBytes(new Uint8Array(signedBytes));

    const finalized: SubmitSignatureResult = await ctx.runMutation(
      api.mutations.finalizeSignature,
      {
        issueId: args.issueId,
        tokenHash: args.tokenHash,
        signedByUserId: args.signedByUserId,
        signedName: args.signedName,
        signedEmail: args.signedEmail,
        signaturePngFileId,
        signedPdfFileId,
        pdfSha256,
        consentText: args.consentText,
        ip: args.ip,
        userAgent: args.userAgent,
      },
    );

    return finalized;
  },
});

export const importTemplatePdfFromUrl = action({
  args: {
    sourceUrl: v.string(),
  },
  returns: v.id("_storage"),
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const url = args.sourceUrl.trim();
    if (!url) {
      throw new Error("Missing source URL.");
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF (${res.status}).`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    const blob = new Blob([bytes], { type: "application/pdf" });
    const stored = await ctx.storage.store(blob);
    return stored;
  },
});
