/**
 * Utility functions for extracting featured images from different file types
 */

import type { StorageId } from "convex/server";
import { v } from "convex/values";

import { ActionCtx, internalAction } from "../../_generated/server";

// We need to use "use node" directive to enable Node.js specific imports
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
("use node");

// Import Node.js specific modules inside the action handler
// These won't be loaded in the V8 runtime but in the Node.js runtime
// when the action is executed

// Type definitions for dynamically imported modules
type PDFJSModule = {
  getDocument: (params: { data: ArrayBuffer }) => {
    promise: Promise<PDFDocumentProxy>;
  };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
};

type PDFDocumentProxy = {
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
};

type PDFPageProxy = {
  getViewport: (params: { scale: number }) => PDFViewport;
  render: (renderContext: RenderContext) => { promise: Promise<void> };
};

type PDFViewport = {
  width: number;
  height: number;
};

type RenderContext = {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
};

type Canvas = {
  getContext: (contextId: string) => CanvasRenderingContext2D;
  toBuffer: (mimeType: string) => Buffer;
  width: number;
  height: number;
};

type CanvasModule = {
  createCanvas: (width: number, height: number) => Canvas;
};

/**
 * Extract a featured image from a file based on its type
 * Note: This runs in Node.js runtime, not the V8 runtime
 */
export const extractFeaturedImage = internalAction({
  args: {
    storageId: v.id("_storage"),
    fileType: v.string(),
    fileExtension: v.string(),
  },
  handler: async (ctx: ActionCtx, args): Promise<StorageId | null> => {
    try {
      const { storageId, fileType, fileExtension } = args;

      // Get the file from storage
      const fileBlob = await ctx.storage.get(storageId);
      if (!fileBlob) {
        console.error("File not found in storage");
        return null;
      }

      // If it's an image, we can use the original file as the featured image
      if (fileType.startsWith("image/")) {
        return storageId;
      }

      // Convert Blob to ArrayBuffer for processing
      const fileArrayBuffer = await fileBlob.arrayBuffer();

      // Extract image from PDF
      if (fileType === "application/pdf" || fileExtension === "pdf") {
        return await extractImageFromPdf(ctx, fileArrayBuffer);
      }

      // Extract image from PowerPoint
      if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        fileExtension === "pptx" ||
        fileExtension === "ppt"
      ) {
        return await extractImageFromPowerPoint(ctx, fileArrayBuffer);
      }

      // Default fallback - no featured image could be extracted
      return null;
    } catch (error) {
      console.error("Error extracting featured image:", error);
      return null;
    }
  },
});

/**
 * Extract the first page of a PDF as an image
 */
async function extractImageFromPdf(
  ctx: ActionCtx,
  pdfData: ArrayBuffer,
): Promise<StorageId | null> {
  try {
    // Import modules in the Node.js runtime
    // Using dynamic imports to avoid loading these in the V8 runtime
    const pdfJsModule = (await import("pdfjs-dist")) as unknown as {
      default: PDFJSModule;
    };
    const pdfjs = pdfJsModule.default;
    const canvasModule = (await import("canvas")) as unknown as CanvasModule;
    const { createCanvas } = canvasModule;

    // Set up worker path for PDF.js
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    // Get the first page
    const page = await pdf.getPage(1);

    // Set the scale to render at
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    // Create a canvas and render the page
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to PNG buffer
    const imageBuffer = canvas.toBuffer("image/png");

    // Upload the extracted image to storage
    const uploadId = await ctx.storage.store(
      new Blob([imageBuffer], { type: "image/png" }),
    );
    return uploadId;
  } catch (error) {
    console.error("Error extracting image from PDF:", error);
    return null;
  }
}

/**
 * Extract the first slide of a PowerPoint presentation as an image
 */
async function extractImageFromPowerPoint(
  ctx: ActionCtx,
  pptxData: ArrayBuffer,
): Promise<StorageId | null> {
  try {
    // Import Node.js modules
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    const util = await import("util");
    const childProcess = await import("child_process");

    // Create a temp file for the PPTX
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pptx`);
    await fs.writeFile(tempFilePath, Buffer.from(pptxData));

    // Create output directory
    const outputDir = path.join(os.tmpdir(), `slides_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    // Try to extract slides as images
    // This attempts several methods, falling back if one fails
    let slideImageData: Buffer | null = null;

    // Attempt 1: Try libreoffice headless conversion (if available in the environment)
    const execPromise = util.promisify(childProcess.exec);
    try {
      await execPromise(
        `libreoffice --headless --convert-to png --outdir "${outputDir}" "${tempFilePath}"`,
        { timeout: 30000 }, // 30 second timeout
      );

      // Get the first slide image
      const files = await fs.readdir(outputDir);
      const slideFiles = files.filter((f) => f.endsWith(".png")).sort();

      if (slideFiles.length > 0) {
        // Read the first slide
        slideImageData = await fs.readFile(path.join(outputDir, slideFiles[0]));
      }
    } catch (error) {
      console.log("LibreOffice extraction failed, trying alternative method");
    }

    // Attempt 2: If libreoffice failed, try using officegen for a simple extraction
    if (!slideImageData) {
      try {
        // This is a simplified approach - in production you'd want a more robust solution
        // For now, we'll create a simple placeholder image
        const canvasModule = (await import(
          "canvas"
        )) as unknown as CanvasModule;
        const { createCanvas } = canvasModule;
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext("2d");

        // Fill with a light gray background
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, 800, 600);

        // Add text
        ctx.fillStyle = "#333333";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PowerPoint Preview", 400, 300);

        // Convert to buffer
        slideImageData = canvas.toBuffer("image/png");
      } catch (err) {
        console.error("Fallback preview generation failed:", err);
        return null;
      }
    }

    // If we have image data, upload it
    if (slideImageData) {
      const uploadId = await ctx.storage.store(
        new Blob([slideImageData], { type: "image/png" }),
      );

      // Clean up temp files
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors
      });
      await fs.rmdir(outputDir, { recursive: true }).catch(() => {
        // Ignore cleanup errors
      });

      return uploadId;
    }

    return null;
  } catch (error) {
    console.error("Error extracting image from PowerPoint:", error);
    return null;
  }
}
