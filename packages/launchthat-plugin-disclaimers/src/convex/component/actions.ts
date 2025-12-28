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
  audit: {
    sentAt?: number;
    firstViewedAt?: number;
    lastViewedAt?: number;
    viewCount?: number;
    completedAt?: number;
  };
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
    signedByUserId: v.optional(v.string()),
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

    const signedEmail = signing.recipientEmail;
    const signedName =
      typeof signing.recipientName === "string" ? signing.recipientName : "";
    const consentText = signing.template.consentText;

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

    const signedAtIso = new Date().toISOString();
    let auditSignatureBytes: Uint8Array | null = null;

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
        if (!auditSignatureBytes) auditSignatureBytes = signatureBytes;
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
      auditSignatureBytes = signatureBytes;

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

      const textY = lineY - 14;
      const lines = [
        `Name: ${signedName}`,
        `Email: ${signedEmail}`,
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
    lastPage.drawText(`Consent: ${consentText}`.slice(0, 500), {
      x: 0,
      y: 0,
      size: 1,
      font,
      color: rgb(1, 1, 1),
      opacity: 0,
    });

    // Add a final certificate page (PandaDoc-style) with signing metadata.
    {
      const lastSize = pages[pages.length - 1]!.getSize();
      const cert = pdf.addPage([lastSize.width, lastSize.height]);
      const { width: pageW, height: pageH } = cert.getSize();

      const marginX = 54;
      const labelColor = rgb(0.35, 0.35, 0.35);
      const valueColor = rgb(0.08, 0.08, 0.08);
      const lineColor = rgb(0.85, 0.85, 0.85);

      const formatUtc = (ms: number) => {
        const d = new Date(ms);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mi = String(d.getUTCMinutes()).padStart(2, "0");
        const ss = String(d.getUTCSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`;
      };

      const wrapText = (text: string, maxWidth: number, size: number) => {
        const words = text.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let current = "";
        for (const w of words) {
          const next = current ? `${current} ${w}` : w;
          const width = font.widthOfTextAtSize(next, size);
          if (width <= maxWidth) {
            current = next;
            continue;
          }
          if (current) lines.push(current);
          current = w;
        }
        if (current) lines.push(current);
        return lines.length > 0 ? lines : [text];
      };

      // Header
      const header = "CERTIFICATE OF SIGNATURE";
      const headerSize = 22;
      const headerW = fontBold.widthOfTextAtSize(header, headerSize);
      cert.drawText(header, {
        x: Math.max(marginX, (pageW - headerW) / 2),
        y: pageH - 72,
        size: headerSize,
        font: fontBold,
        color: valueColor,
      });

      // Document meta (left, under header)
      const metaY = pageH - 110;
      cert.drawText(`Document: ${signing.template.title}`, {
        x: marginX,
        y: metaY,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      cert.drawText(`Issue ID: ${String(args.issueId)}`, {
        x: marginX,
        y: metaY - 16,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Table header
      const tableTop = metaY - 54;
      const signerX = marginX;
      const timestampX = Math.floor(pageW * 0.44);
      const signatureX = Math.floor(pageW * 0.66);
      const tableRight = pageW - marginX;

      cert.drawText("SIGNER", {
        x: signerX,
        y: tableTop + 14,
        size: 10,
        font: fontBold,
        color: valueColor,
      });
      cert.drawText("TIMESTAMP", {
        x: timestampX,
        y: tableTop + 14,
        size: 10,
        font: fontBold,
        color: valueColor,
      });
      cert.drawText("SIGNATURE", {
        x: signatureX,
        y: tableTop + 14,
        size: 10,
        font: fontBold,
        color: valueColor,
      });

      cert.drawLine({
        start: { x: marginX, y: tableTop },
        end: { x: tableRight, y: tableTop },
        thickness: 1,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Row content
      const rowTop = tableTop - 30;

      // Signer column
      cert.drawText("EMAIL", { x: signerX, y: rowTop, size: 9, font, color: labelColor });
      cert.drawText(signedEmail, {
        x: signerX,
        y: rowTop - 14,
        size: 11,
        font: fontBold,
        color: valueColor,
      });

      // Timestamp column
      const sentAt = typeof signing.audit?.sentAt === "number" ? signing.audit.sentAt : null;
      const viewedAt =
        typeof signing.audit?.lastViewedAt === "number" ? signing.audit.lastViewedAt : null;
      const signedAt = signedAtIso ? Date.parse(signedAtIso) : Date.now();

      const timeLabelX = timestampX;
      const timeValueX = timestampX;
      let ty = rowTop;
      const drawTime = (label: string, value: string) => {
        cert.drawText(label, { x: timeLabelX, y: ty, size: 9, font, color: labelColor });
        cert.drawText(value, {
          x: timeValueX,
          y: ty - 14,
          size: 11,
          font: fontBold,
          color: valueColor,
        });
        ty -= 34;
      };
      drawTime("SENT", sentAt ? formatUtc(sentAt) : "—");
      drawTime("VIEWED", viewedAt ? formatUtc(viewedAt) : "—");
      drawTime("SIGNED", formatUtc(isFinite(signedAt) ? signedAt : Date.now()));

      // Signature column (box + IP)
      const sigBoxW = tableRight - signatureX;
      const sigBoxH = 110;
      const sigBoxX = signatureX;
      const sigBoxY = rowTop - sigBoxH + 6;
      cert.drawRectangle({
        x: sigBoxX,
        y: sigBoxY,
        width: sigBoxW,
        height: sigBoxH,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      if (auditSignatureBytes) {
        const sigPng = await pdf.embedPng(auditSignatureBytes);
        const dims = sigPng.scale(1);
        const scale = Math.min((sigBoxW - 24) / dims.width, (sigBoxH - 24) / dims.height, 1);
        const sigW = dims.width * scale;
        const sigH = dims.height * scale;
        cert.drawImage(sigPng, {
          x: sigBoxX + (sigBoxW - sigW) / 2,
          y: sigBoxY + (sigBoxH - sigH) / 2,
          width: sigW,
          height: sigH,
        });
      }

      const ipValue =
        typeof args.ip === "string" && args.ip.trim().length > 0 ? args.ip.trim() : "—";
      cert.drawText("IP ADDRESS", {
        x: signatureX,
        y: sigBoxY - 18,
        size: 9,
        font,
        color: labelColor,
      });
      cert.drawText(ipValue, {
        x: signatureX,
        y: sigBoxY - 32,
        size: 11,
        font: fontBold,
        color: valueColor,
      });

      // Divider below table
      const tableBottom = sigBoxY - 54;
      cert.drawLine({
        start: { x: marginX, y: tableBottom },
        end: { x: tableRight, y: tableBottom },
        thickness: 1,
        color: lineColor,
      });

      // User agent (wrapped, below table)
      const ua =
        typeof args.userAgent === "string" && args.userAgent.trim().length > 0
          ? args.userAgent.trim()
          : "";
      if (ua) {
        const uaLabelY = tableBottom - 28;
        cert.drawText("USER AGENT", {
          x: marginX,
          y: uaLabelY,
          size: 9,
          font,
          color: labelColor,
        });
        const uaLines = wrapText(ua, tableRight - marginX, 10);
        uaLines.slice(0, 3).forEach((line, idx) => {
          cert.drawText(line, {
            x: marginX,
            y: uaLabelY - 14 - idx * 12,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
      }
    }

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
        signedName,
        signedEmail,
        signaturePngFileId,
        signedPdfFileId,
        pdfSha256,
        consentText,
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
