# Downloads Module - Featured Image Extraction

This module provides automatic featured image extraction for uploaded files in the Downloads section of the portal. The feature extracts appropriate preview images based on file type:

- **Images**: Uses the original image as the featured image
- **PDFs**: Extracts the first page as an image preview
- **PowerPoint files**: Extracts the first slide as an image preview
- **Other files**: Uses a generic icon based on file type

## Key Components

1. **Schema Extension**:

   - Added `featuredImageId` field to the `downloads` table schema to store references to extracted preview images

2. **Extraction Process**:

   - Implemented in `downloads/lib/imageExtraction.ts`
   - Uses Node.js runtime for file processing via Convex actions
   - Handles different file types with specialized extraction logic

3. **Key Functions**:
   - `extractFeaturedImage`: Main action that processes files and extracts previews
   - `extractAndAttachFeaturedImage`: Coordinates the extraction and database update
   - `updateFeaturedImage`: Updates the download record with the extracted image ID

## Technical Implementation

### For PDF Files

- Uses `pdfjs-dist` to render the first page of PDFs
- Converts the rendered page to an image using `canvas`

### For PowerPoint Files

- Uses `officegen` to process PowerPoint files
- Extracts the first slide and converts it to an image

### For Image Files

- Uses the original image without modification

## Dependencies

The implementation relies on these external packages:

- `pdfjs-dist`: For PDF processing
- `canvas`: For rendering extracted content to images
- `officegen`: For processing Office documents

## Integration Points

1. **File Upload Flow**:

   - `createFileDownload` mutation automatically triggers featured image extraction
   - Extraction happens asynchronously after upload completes

2. **File Deletion**:
   - `deleteDownload` mutation properly cleans up featured images
   - Prevents orphaned files in storage

## Testing

A test page is available at `/test/downloads` that demonstrates this functionality.

## Example Usage

```typescript
// When creating a file download, the featured image is automatically extracted
const downloadId = await createFileDownload({
  storageId,
  title: "My Document",
  description: "Example document",
  isPublic: true,
  // The featured image extraction happens automatically
});

// To access the featured image in the UI
const download = // get download from query
if (download.featuredImageId) {
  const imageUrl = `/api/convex/storage/${download.featuredImageId}`;
  // Use imageUrl in an <img> element
}
```
