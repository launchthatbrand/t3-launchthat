// Import getFileExtension and getFileTypeFromExtension to maintain backward compatibility
import {
  getFileExtension,
  getFileTypeFromExtension,
} from "./downloads/lib/fileTypeUtils";
import { checkDownloadAccess } from "./downloads/lib/helpers";

/**
 * @deprecated Use downloads/ directory instead
 *
 * This file is maintained for backward compatibility during the refactoring.
 * All downloads functionality has been moved to the downloads/ directory.
 */

// Re-export all functions from the new location for backward compatibility
export * from "./downloads/index";

// Export these functions for backward compatibility
export { getFileExtension, getFileTypeFromExtension, checkDownloadAccess };
