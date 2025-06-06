/**
 * Test page for the Downloads module with featured image extraction
 */

import { UploadWithPreview } from "../../_components/downloads/UploadWithPreview";

export default function DownloadsTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Downloads Module Test</h1>
        <p className="text-gray-600">
          This page demonstrates the automatic featured image extraction
          functionality for the Downloads module. Upload different file types to
          see how the system automatically generates preview images.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <UploadWithPreview />
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-2xl font-bold">Supported File Types</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Images:</strong> Uses the original image as the featured
              image
            </li>
            <li>
              <strong>PDFs:</strong> Extracts the first page as the featured
              image
            </li>
            <li>
              <strong>PowerPoint:</strong> Extracts the first slide as the
              featured image
            </li>
            <li>
              <strong>Other files:</strong> Uses a generic icon based on file
              type
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
