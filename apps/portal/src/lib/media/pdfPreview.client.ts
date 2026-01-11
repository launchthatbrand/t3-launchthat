"use client";

interface PdfJsModule {
  getDocument: (src: unknown) => { promise: Promise<PdfDocumentProxy> };
  GlobalWorkerOptions?: { workerSrc?: string };
}

interface PdfDocumentProxy {
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
}

interface PdfPageProxy {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

const getPdfJs = async (): Promise<PdfJsModule> => {
  const pdfjs = (await import("pdfjs-dist")) as unknown as PdfJsModule;

  // Ensure pdf.js can find its worker script under Next.js.
  // Without this, pdf.js will try to set up a "fake worker" and may fail to load
  // the worker script from a guessed /_next/static/... path.
  try {
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.js",
        import.meta.url,
      ).toString();
    }
  } catch {
    // If worker setup fails, pdf.js may still be able to render (slower) depending on runtime.
  }

  return pdfjs;
};

export const renderPdfFirstPageToPngBlob = async (pdfBytes: ArrayBuffer) => {
  const pdfjs = await getPdfJs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  const viewport1x = page.getViewport({ scale: 1 });
  const targetWidth = 640;
  const scale = viewport1x.width > 0 ? targetWidth / viewport1x.width : 1;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering context not available.");
  }

  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error("Failed to create PNG blob."));
      else resolve(b);
    }, "image/png");
  });

  return blob;
};
