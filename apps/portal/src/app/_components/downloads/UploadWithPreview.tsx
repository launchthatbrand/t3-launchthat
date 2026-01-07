/**
 * File upload component with automatic featured image extraction
 */
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// Define a type that includes the featuredImageId property
interface DownloadWithFeaturedImage {
  _id: Id<"downloads">;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  categoryId?: Id<"downloadCategories">;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  featuredImageId?: Id<"_storage">;
}

export function UploadWithPreview() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedId, setUploadedId] = useState<Id<"downloads"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.downloads.generateUploadUrl);
  const createFileDownload = useMutation(api.downloads.createFileDownload);

  // Query for all downloads to find the one we just uploaded
  // In a real app, you'd create a specific API endpoint to get a single download
  const downloads = useQuery(api.downloads.listDownloads, {});

  // Find the download we just uploaded and cast it to our extended type
  const download =
    uploadedId && downloads
      ? (downloads.find((d) => d._id === uploadedId) as
          | DownloadWithFeaturedImage
          | undefined)
      : null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Step 1: Get a URL to upload the file to storage
      const uploadUrl = await generateUploadUrl({});

      // Step 2: Upload the file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Failed to upload file: ${result.statusText}`);
      }

      // Step 3: Get the storage ID from the response
      const { storageId } = await result.json();

      // Step 4: Create a download record with automatic featured image extraction
      const downloadId = await createFileDownload({
        storageId,
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        isPublic: true,
        // The featured image will be automatically extracted
      });

      setUploadedId(downloadId);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Upload File with Preview</h2>
      <p className="mb-4 text-gray-600">
        Upload any file to see the automatic featured image extraction in
        action. Images, PDFs, and PowerPoint files will have their preview
        generated automatically.
      </p>

      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
          disabled={uploading}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-primary-600 hover:bg-primary-700 rounded-md px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {uploading ? "Uploading..." : "Upload File"}
      </button>

      {error && <p className="mt-2 text-red-500">{error}</p>}

      {download && (
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold">Upload Complete</h3>
          <div className="rounded-md border border-gray-200 p-4">
            <p className="mb-2">
              <strong>File Name:</strong> {download.fileName}
            </p>
            <p className="mb-2">
              <strong>Type:</strong> {download.fileType}
            </p>
            <p className="mb-2">
              <strong>Size:</strong> {(download.fileSize / 1024).toFixed(2)} KB
            </p>

            {download.featuredImageId && (
              <div className="mt-4">
                <p className="mb-2 font-semibold">Featured Image Preview:</p>
                <img
                  src={`/api/convex/storage/${download.featuredImageId}`}
                  alt="Preview"
                  className="h-auto max-h-[300px] max-w-full rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
