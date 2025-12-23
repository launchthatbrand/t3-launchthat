"use node";

import { v } from "convex/values";
import {
  buildSupportOpenAiOwnerKey,
  SUPPORT_OPENAI_NODE_TYPE,
} from "launchthat-plugin-support/assistant/openai";

import type { Id } from "../../_generated/dataModel";
import type { MetaValue } from "../../../../../packages/launchthat-plugin-lms/src/types";
import { api, internal } from "../../_generated/api";
import { action } from "../../_generated/server";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import {
  buildQuizPrompt,
  quizResponseSchema,
} from "../../../../../packages/launchthat-ai/src";

type SupportedPdfImageFormat = "png" | "jpeg";

const detectImageFormat = (bytes: Uint8Array): SupportedPdfImageFormat | "webp" | "svg" | "unknown" => {
  if (bytes.length < 12) return "unknown";

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG SOI: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "webp";
  }

  // SVG/XML (best-effort): starts with '<' after whitespace
  // We only look at a small prefix to avoid decoding huge buffers.
  try {
    const prefix = new TextDecoder().decode(bytes.slice(0, Math.min(256, bytes.length)));
    if (prefix.trimStart().startsWith("<")) {
      if (prefix.toLowerCase().includes("<svg")) return "svg";
      return "unknown";
    }
  } catch {
    // ignore
  }

  return "unknown";
};

const indexOfBytes = (haystack: Uint8Array, needle: Uint8Array, from = 0): number => {
  if (needle.length === 0) return -1;
  for (let i = Math.max(0, from); i <= haystack.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
};

const tryExtractMultipartSingleFile = (bytes: Uint8Array): Uint8Array | null => {
  // Handles the common case where we accidentally stored a multipart/form-data payload
  // in Convex Storage (e.g. it starts with "------WebKitFormBoundary...").
  // We extract the first part's raw body and return it.
  if (bytes.length < 64) return null;

  // Fast check for typical multipart prefix.
  const prefix = bytes.slice(0, Math.min(2048, bytes.length));
  const prefixText = (() => {
    try {
      return new TextDecoder().decode(prefix);
    } catch {
      return "";
    }
  })();
  if (!prefixText.includes("Content-Disposition: form-data")) return null;

  // Boundary delimiter line is the very first line. It may be terminated by CRLF or LF.
  const crlf = new Uint8Array([0x0d, 0x0a]); // \r\n
  const lf = new Uint8Array([0x0a]); // \n
  const firstCrlf = indexOfBytes(bytes, crlf, 0);
  const firstLf = firstCrlf >= 0 ? firstCrlf : indexOfBytes(bytes, lf, 0);
  if (firstLf <= 0) return null;
  const boundaryLine = bytes.slice(0, firstLf); // includes leading hyphens

  // Find end of headers (\r\n\r\n or \n\n) after boundary line.
  const headerSepCrlf = new Uint8Array([0x0d, 0x0a, 0x0d, 0x0a]); // \r\n\r\n
  const headerSepLf = new Uint8Array([0x0a, 0x0a]); // \n\n
  const headersEndCrlf = indexOfBytes(bytes, headerSepCrlf, firstLf + 1);
  const headersEndLf =
    headersEndCrlf >= 0 ? -1 : indexOfBytes(bytes, headerSepLf, firstLf + 1);
  const headersEnd = headersEndCrlf >= 0 ? headersEndCrlf : headersEndLf;
  if (headersEnd < 0) return null;
  const bodyStart =
    headersEnd + (headersEndCrlf >= 0 ? headerSepCrlf.length : headerSepLf.length);

  // Next boundary is preceded by newline + boundaryLine
  const newline = headersEndCrlf >= 0 ? crlf : lf;
  const boundaryNeedle = new Uint8Array(newline.length + boundaryLine.length);
  boundaryNeedle.set(newline, 0);
  boundaryNeedle.set(boundaryLine, newline.length);

  const nextBoundary = indexOfBytes(bytes, boundaryNeedle, bodyStart);
  if (nextBoundary < 0) return null;
  let bodyEnd = nextBoundary; // points at newline before boundary

  // Strip trailing newline from body if present.
  if (headersEndCrlf >= 0) {
    if (
      bodyEnd >= 2 &&
      bytes[bodyEnd - 2] === 0x0d &&
      bytes[bodyEnd - 1] === 0x0a
    ) {
      bodyEnd -= 2;
    }
  } else {
    if (bodyEnd >= 1 && bytes[bodyEnd - 1] === 0x0a) {
      bodyEnd -= 1;
    }
  }
  if (bodyEnd <= bodyStart) return null;
  return bytes.slice(bodyStart, bodyEnd);
};

const tryExtractEmbeddedImageByMagic = (bytes: Uint8Array): Uint8Array | null => {
  // Last-resort: find PNG/JPEG magic bytes somewhere inside the payload
  // and slice from there (optionally trimming at the next multipart boundary).
  const pngSig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpgSig = new Uint8Array([0xff, 0xd8, 0xff]);
  const pngAt = indexOfBytes(bytes, pngSig, 0);
  const jpgAt = pngAt >= 0 ? -1 : indexOfBytes(bytes, jpgSig, 0);
  const start = pngAt >= 0 ? pngAt : jpgAt;
  if (start < 0) return null;

  // If the payload looks like multipart, try to trim at the next boundary marker.
  const slice = bytes.slice(start);
  try {
    const head = new TextDecoder().decode(bytes.slice(0, Math.min(4096, bytes.length)));
    const m = head.match(/^-{2,}([A-Za-z0-9'()+_,.\/:=?-]+)\s*$/m);
    // If we can’t confidently find boundary, just return the remainder.
    if (!m) return slice;
    const boundary = m[0].trim();
    const boundaryBytes = new TextEncoder().encode(boundary);
    const lf = new Uint8Array([0x0a]);
    const needle = new Uint8Array(lf.length + boundaryBytes.length);
    needle.set(lf, 0);
    needle.set(boundaryBytes, lf.length);
    const cut = indexOfBytes(slice, needle, 0);
    if (cut > 0) return slice.slice(0, cut);
    return slice;
  } catch {
    return slice;
  }
};

const bytesToHex = (bytes: Uint8Array, limit = 64): string => {
  const n = Math.min(limit, bytes.length);
  let out = "";
  for (let i = 0; i < n; i++) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }
  return out;
};

const bytesToAsciiPreview = (bytes: Uint8Array, limit = 64): string => {
  const n = Math.min(limit, bytes.length);
  let out = "";
  for (let i = 0; i < n; i++) {
    const b = bytes[i]!;
    // Printable ASCII only; replace others with '.'
    out += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
  }
  return out;
};

const getStorageBytes = async (
  ctx: any,
  storageId: any,
): Promise<ArrayBuffer | null> => {
  const raw = await ctx.storage.get(storageId);
  if (!raw) return null;

  const normalizeToArrayBuffer = async (value: any): Promise<ArrayBuffer | null> => {
    if (!value) return null;
    if (value instanceof ArrayBuffer) return value;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView?.(value)) {
      const view = value as ArrayBufferView;
      return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    }
    // Node actions can surface Blob in some environments.
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return await value.arrayBuffer();
    }
    return null;
  };

  const bytes = await normalizeToArrayBuffer(raw);
  if (!bytes) {
    const tag = Object.prototype.toString.call(raw);
    const keys =
      raw && typeof raw === "object" ? Object.keys(raw).slice(0, 12) : [];
    throw new Error(
      `Storage returned non-bytes for storageId=${String(storageId)} ` +
        `debug={type:${typeof raw},tag:${tag},keys:${JSON.stringify(keys)}}`,
    );
  }

  // We've observed cases where storage objects exist but `ctx.storage.get()`
  // returns an empty ArrayBuffer while the public URL still serves the content.
  // If that happens, fetch via URL as a fallback.
  if (bytes.byteLength === 0) {
    let url: string | null = null;
    let urlFetchStatus: number | null = null;
    let urlFetchContentType: string | null = null;
    let urlFetchLen: number | null = null;

    // In some environments, `ctx.storage.getUrl()` from an action can be flaky.
    // Prefer the query runtime to resolve the URL when possible.
    try {
      const media: any = await ctx.runQuery(
        api.core.media.queries.getMediaByStorageId as any,
        { storageId },
      );
      if (media?.url && typeof media.url === "string") {
        url = media.url;
      }
    } catch {
      // ignore
    }

    if (!url) {
      try {
        url = ((await ctx.storage.getUrl(storageId)) as string | null) ?? null;
      } catch {
        url = null;
      }
    }

    if (url) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        urlFetchStatus = res.status;
        urlFetchContentType = res.headers.get("content-type");
        if (res.ok) {
          const buf = await res.arrayBuffer();
          urlFetchLen = buf.byteLength;
          if (buf.byteLength > 0) return buf;
        }
      } catch {
        // ignore; caller will handle the empty bytes case
      }
    }

    // Still empty: include _storage metadata to diagnose.
    let meta: any = null;
    try {
      meta = await ctx.runQuery(api.core.media.queries.getStorageMetadata as any, {
        storageId,
      });
    } catch {
      meta = null;
    }
    throw new Error(
      `Empty storage bytes for storageId=${String(storageId)} ` +
        `debug={getLen:0,url:${url ?? "null"},urlStatus:${urlFetchStatus ?? "null"},urlCt:${urlFetchContentType ?? "null"},urlLen:${urlFetchLen ?? "null"},meta:${meta ? JSON.stringify(meta) : "null"}}`,
    );
  }

  return bytes;
};

const embedPdfImage = async (pdfDoc: PDFDocument, bytes: ArrayBuffer, label: string) => {
  let uint8 = new Uint8Array(bytes);
  let format = detectImageFormat(uint8);
  const originalLen = uint8.length;

  // If the stored bytes are actually a multipart/form-data payload, extract the file
  // bytes and retry. This helps recover older "corrupted" uploads.
  if (format === "unknown") {
    const extracted = tryExtractMultipartSingleFile(uint8);
    if (extracted) {
      uint8 = extracted;
      format = detectImageFormat(uint8);
    }
  }

  // If we still can't detect it, attempt a magic-byte scan for embedded PNG/JPEG.
  if (format === "unknown") {
    const extracted = tryExtractEmbeddedImageByMagic(uint8);
    if (extracted) {
      uint8 = extracted;
      format = detectImageFormat(uint8);
    }
  }

  if (format === "png") {
    return await pdfDoc.embedPng(uint8);
  }
  if (format === "jpeg") {
    return await pdfDoc.embedJpg(uint8);
  }

  // Best-effort conversion for formats pdf-lib doesn't support natively.
  // This keeps the editor flexible (WEBP/SVG are common on the web) while still
  // generating PDFs reliably.
  if (format === "webp" || format === "svg") {
    try {
      // Lazy-load so dev environments without sharp still work.
      const mod = await import("sharp");
      const sharp = (mod as any).default ?? (mod as any);
      const input = Buffer.from(uint8);
      const converted = await sharp(input).png().toBuffer();
      return await pdfDoc.embedPng(new Uint8Array(converted));
    } catch (err) {
      const hint =
        format === "webp"
          ? "This looks like a WEBP. Please re-upload as PNG or JPG (or ensure server-side conversion is available)."
          : "This looks like an SVG. Please upload a PNG or JPG version (or ensure server-side conversion is available).";
      throw new Error(
        `Unsupported image format for ${label}. ${hint} (Conversion failed: ${err instanceof Error ? err.message : "unknown error"})`,
      );
    }
  }

  const hint =
    format === "webp"
      ? "This looks like a WEBP. Please re-upload as PNG or JPG (WEBP isn't supported in PDFs yet)."
      : format === "svg"
        ? "This looks like an SVG. Please upload a PNG or JPG version for PDF export."
        : "This file does not look like a PNG/JPG.";

  // Diagnostics to quickly pinpoint what is actually stored in Convex Storage.
  // Keep this compact so it’s safe to bubble to the client in dev.
  let containsMultipartMarkers = false;
  try {
    const head = new TextDecoder().decode(uint8.slice(0, Math.min(4096, uint8.length)));
    containsMultipartMarkers =
      head.includes("Content-Disposition: form-data") ||
      head.includes("WebKitFormBoundary") ||
      head.includes("multipart/form-data");
  } catch {
    // ignore
  }
  const pngSig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpgSig = new Uint8Array([0xff, 0xd8, 0xff]);
  const pngAt = indexOfBytes(uint8, pngSig, 0);
  const jpgAt = pngAt >= 0 ? -1 : indexOfBytes(uint8, jpgSig, 0);

  throw new Error(
    `Unsupported image format for ${label}. ${hint} ` +
      `debug={len:${originalLen},headHex:${bytesToHex(uint8)},headAscii:${bytesToAsciiPreview(uint8)},multipart:${containsMultipartMarkers},pngAt:${pngAt},jpgAt:${jpgAt}}`,
  );
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);

const buildQuizSlug = (title: string) => {
  const base = slugify(title || "lesson-quiz");
  return `${base}-${Math.random().toString(36).slice(-6)}`;
};

type QuizQuestionInput = {
  prompt: string;
  questionType: "singleChoice" | "shortText";
  options?: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  answerText?: string | null;
};

export const generateQuizFromTranscript = action({
  args: {
    organizationId: v.id("organizations"),
    lessonId: v.id("posts"),
    questionCount: v.optional(v.number()),
  },
  returns: v.object({
    quizId: v.id("posts"),
    quizTitle: v.string(),
    questionCount: v.number(),
    builderUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const openaiApiKey = await resolveOrganizationOpenAiApiKey(
      ctx,
      args.organizationId,
    );
    if (!openaiApiKey) {
      throw new Error(
        "OpenAI key is not connected for this organization. Add one under Support → Settings → AI assistant.",
      );
    }

    const lesson = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id: args.lessonId,
      organizationId: args.organizationId,
    });
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Quiz generation currently supports lesson posts only.");
    }

    const metaMap = await fetchPostMetaMap(
      ctx,
      args.lessonId,
      args.organizationId,
    );
    const transcriptRaw = metaMap.get("vimeoTranscript");
    if (typeof transcriptRaw !== "string" || transcriptRaw.length < 200) {
      throw new Error(
        "Lesson transcript missing or too short. Save a transcript before generating quizzes.",
      );
    }

    const prompt = buildQuizPrompt({
      lessonTitle: lesson.title ?? "Untitled lesson",
      transcript: transcriptRaw,
      questionCount: args.questionCount ?? 5,
    });

    const quizResponse = await requestQuizFromOpenAi({
      apiKey: openaiApiKey,
      prompt,
    });

    const parsed = quizResponseSchema.safeParse(quizResponse);
    if (!parsed.success) {
      throw new Error("Quiz assistant returned an invalid response.");
    }

    const questions = parsed.data.questions ?? [];
    if (questions.length === 0) {
      throw new Error("The quiz assistant was unable to generate questions.");
    }

    const quizTitle =
      lesson.title && lesson.title.length > 0
        ? `${lesson.title} Quiz`
        : "Auto-generated Quiz";

    const quizOrganizationId = lesson.organizationId ?? undefined;
    const quizId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: quizTitle,
        slug: buildQuizSlug(quizTitle),
        status: "draft",
        postTypeSlug: "quizzes",
        organizationId: quizOrganizationId,
        meta: {
          source: "assistant",
          sourceLessonId: args.lessonId,
        },
      },
    );

    await ctx.runMutation(internal.plugins.lms.mutations.attachQuizToLesson, {
      lessonId: args.lessonId,
      quizId,
      order: 0,
      isFinal: false,
    });

    let createdQuestions = 0;
    for (const question of questions) {
      const promptText = question.prompt?.trim();
      if (!promptText) {
        continue;
      }
      const options = Array.isArray(question.choices)
        ? question.choices.slice(0, 5).map((choice, index) => ({
            id: `opt-${index}-${Math.random().toString(36).slice(-4)}`,
            label: choice,
          }))
        : [];
      const normalizedCorrect = question.correctAnswer?.trim().toLowerCase();
      const resolvedCorrect =
        options.find(
          (option) =>
            option.label.trim().toLowerCase() === normalizedCorrect &&
            normalizedCorrect.length > 0,
        ) ?? options[0];

      const payload: QuizQuestionInput = {
        prompt: promptText,
        questionType: options.length > 0 ? "singleChoice" : "shortText",
        options: options.length > 0 ? options : undefined,
        correctOptionIds:
          options.length > 0 && resolvedCorrect
            ? [resolvedCorrect.id]
            : undefined,
        answerText: question.explanation ?? question.correctAnswer ?? null,
      };

      await ctx.runMutation(internal.plugins.lms.mutations.createQuizQuestion, {
        quizId,
        organizationId: quizOrganizationId,
        question: payload,
      });
      createdQuestions += 1;
    }

    if (createdQuestions === 0) {
      throw new Error("No usable questions were generated for this lesson.");
    }

    return {
      quizId,
      quizTitle,
      questionCount: createdQuestions,
      builderUrl: `/admin/edit?post_type=quizzes&post_id=${quizId}`,
    };
  },
});

const CERTIFICATE_TEMPLATE_META_KEY = "certificateTemplate";

type CertificateTemplateV1 = {
  version: 1;
  page: { size: "letter" | "a4"; orientation: "portrait" | "landscape" };
  background?: { storageId: string; widthPx: number; heightPx: number };
  elements: Array<
    | {
        id: string;
        kind: "image";
        storageId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        zIndex?: number;
      }
    | {
        id: string;
        kind: "placeholder";
        placeholderKey:
          | "userName"
          | "completionDate"
          | "courseTitle"
          | "certificateId"
          | "organizationName";
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        zIndex?: number;
        style: {
          fontFamily: string;
          fontSize: number;
          color: string;
          align: "left" | "center" | "right";
          fontWeight: number;
        };
      }
  >;
};

const parseHexColor = (hex: string) => {
  const normalized = hex.trim().replace("#", "");
  if (normalized.length !== 6) {
    return rgb(0, 0, 0);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0,
  );
};

const resolvePageSizePoints = (page: CertificateTemplateV1["page"]) => {
  // Points @ 72 DPI.
  const letter = { w: 612, h: 792 };
  const a4 = { w: 595, h: 842 };
  const base = page.size === "a4" ? a4 : letter;
  return page.orientation === "landscape"
    ? { width: base.h, height: base.w }
    : { width: base.w, height: base.h };
};

const resolveCanvasSizePx = (page: CertificateTemplateV1["page"]) => {
  // Must match editor sizes.
  const letter = { w: 816, h: 1056 };
  const a4 = { w: 794, h: 1123 };
  const base = page.size === "a4" ? a4 : letter;
  return page.orientation === "landscape"
    ? { width: base.h, height: base.w }
    : { width: base.w, height: base.h };
};

export const generateCertificatePdf = action({
  args: {
    certificateId: v.string(),
    organizationId: v.optional(v.string()),
    templateOverride: v.optional(v.any()),
    context: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.bytes(),
  handler: async (ctx, args) => {
    const post: any = await ctx.runQuery(api.plugins.lms.posts.queries.getPostById as any, {
      id: args.certificateId,
      organizationId: args.organizationId,
    });
    if (!post) {
      throw new Error("Certificate not found");
    }

    const metaEntries: any[] = await ctx.runQuery(api.plugins.lms.posts.queries.getPostMeta as any, {
      postId: args.certificateId,
      organizationId: args.organizationId,
    });
    const meta = new Map<string, any>();
    metaEntries.forEach((entry) => {
      if (entry?.key) {
        meta.set(String(entry.key), entry.value);
      }
    });

    const template: CertificateTemplateV1 | null = (() => {
      if (args.templateOverride && typeof args.templateOverride === "object") {
        return args.templateOverride as CertificateTemplateV1;
      }
      const raw = meta.get(CERTIFICATE_TEMPLATE_META_KEY);
      if (typeof raw !== "string" || raw.trim().length === 0) return null;
      try {
        const parsed = JSON.parse(raw) as CertificateTemplateV1;
        return parsed?.version === 1 ? parsed : null;
      } catch {
        return null;
      }
    })();

    if (!template) {
      throw new Error("Certificate template is missing or invalid");
    }

    const pageSize = resolvePageSizePoints(template.page);
    const canvasSize = resolveCanvasSizePx(template.page);
    const pxToPtScale = pageSize.width / canvasSize.width;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    if (template.background?.storageId) {
      const storageId = template.background.storageId as any;
      const bytes = await getStorageBytes(ctx, storageId);
      if (bytes) {
        const embedded = await embedPdfImage(
          pdfDoc,
          bytes,
          `certificate background image (storageId: ${String(storageId)})`,
        );
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: pageSize.width,
          height: pageSize.height,
        });
      }
    }

    const context = {
      userName: "Jane Doe",
      completionDate: new Date().toLocaleDateString(),
      courseTitle: "Example Course",
      certificateId: args.certificateId,
      organizationName: "Organization",
      ...(args.context ?? {}),
    };

    const ordered = (template.elements ?? [])
      .slice()
      .sort((a: any, b: any) => (a?.zIndex ?? 0) - (b?.zIndex ?? 0));

    for (const el of ordered) {
      if (el.kind === "image") {
        if (!el.storageId) continue;
        const bytes = await getStorageBytes(ctx, el.storageId as any);
        if (!bytes) continue;
        const embedded = await embedPdfImage(
          pdfDoc,
          bytes,
          `certificate element image (storageId: ${String(el.storageId)})`,
        );

        const x = el.x * pxToPtScale;
        const yTop = el.y * pxToPtScale;
        const w = el.width * pxToPtScale;
        const h = el.height * pxToPtScale;
        const y = pageSize.height - yTop - h;

        page.drawImage(embedded, {
          x,
          y,
          width: w,
          height: h,
          rotate: degrees(el.rotation ?? 0),
        });
        continue;
      }

      if (el.kind !== "placeholder") continue;
      const text = context[el.placeholderKey] ?? "";
      const fontSize = Math.max(6, (el.style.fontSize ?? 16) * pxToPtScale);
      const color = parseHexColor(el.style.color ?? "#000000");

      const boxX = el.x * pxToPtScale;
      const boxYTop = el.y * pxToPtScale;
      const boxW = (el.width ?? 200) * pxToPtScale;

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const alignedX =
        el.style.align === "center"
          ? boxX + Math.max(0, (boxW - textWidth) / 2)
          : el.style.align === "right"
            ? boxX + Math.max(0, boxW - textWidth)
            : boxX;

      // Convert from top-left canvas coords to bottom-left PDF coords.
      const y = pageSize.height - boxYTop - fontSize;
      page.drawText(text, {
        x: alignedX,
        y,
        size: fontSize,
        font,
        color,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Uint8Array(pdfBytes).buffer;
  },
});

const resolveOrganizationOpenAiApiKey = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  organizationId: Id<"organizations">,
) => {
  const ownerId = buildSupportOpenAiOwnerKey(organizationId);
  console.log("[lms] resolve OpenAI key", { organizationId, ownerId });
  const connection = await ctx.runQuery(
    internal.integrations.connections.queries.getConnectionByNodeTypeAndOwner,
    {
      nodeType: SUPPORT_OPENAI_NODE_TYPE,
      ownerId,
    },
  );
  if (!connection) {
    console.warn("[lms] no org OpenAI connection found, falling back", {
      ownerId,
    });
    const fallbackConnections = await ctx.runQuery(
      api.integrations.connections.queries.list,
      {
        nodeType: SUPPORT_OPENAI_NODE_TYPE,
      },
    );
    const fallback = fallbackConnections[0];
    if (!fallback) {
      return null;
    }
    return await resolveApiKeyFromConnection(ctx, fallback._id);
  }
  return await resolveApiKeyFromConnection(ctx, connection._id);
};

const resolveApiKeyFromConnection = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  connectionId: Id<"connections">,
) => {
  const decrypted = await ctx.runAction(
    internal.integrations.connections.cryptoActions.getDecryptedSecrets,
    {
      connectionId,
    },
  );
  if (!decrypted?.credentials) {
    return null;
  }
  return (
    decrypted.credentials.token ??
    decrypted.credentials.apiKey ??
    decrypted.credentials.api_key ??
    decrypted.credentials.key ??
    null
  );
};

const fetchPostMetaMap = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  postId: Id<"posts">,
  organizationId: Id<"organizations">,
) => {
  const entries = await ctx.runQuery(api.core.posts.queries.getPostMeta, {
    postId,
    organizationId,
  });
  return new Map<string, MetaValue>(
    entries.map((entry) => [entry.key, entry.value ?? null]),
  );
};

const QUIZ_SYSTEM_PROMPT =
  "You are an LMS assistant that turns lesson transcripts into high-quality quizzes. " +
  "Return strictly formatted JSON matching the provided schema.";

const requestQuizFromOpenAi = async ({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: QUIZ_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody.slice(0, 2000)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("OpenAI response was not valid JSON.");
  }
};
