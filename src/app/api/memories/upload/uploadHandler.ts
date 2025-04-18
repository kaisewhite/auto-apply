import { langbaseClient } from "@/lib/langbaseClient"; // Import the shared client
import { ContentType } from "langbase"; // Import ContentType

// Define allowed file extensions (case-insensitive)
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];

// Map file extensions to MIME types for Langbase
// NOTE: Mapping .doc/.docx to text/plain as direct MIME types might not be supported by Langbase SDK's ContentType
const EXT_TO_MIME_TYPE: Record<string, ContentType> = {
  pdf: "application/pdf",
  doc: "text/plain", // Fallback for .doc
  docx: "text/plain", // Fallback for .docx
  txt: "text/plain",
};

interface FileValidationResult {
  isValid: boolean;
  type: string | null; // e.g., 'pdf', 'word', 'txt'
  extension: string | null;
  error: string | null;
}

interface FileUploadResult {
  success: boolean;
  processedFileCount: number; // Renamed for clarity
  uploadedFileCount: number;
  errors: string[];
  status: number; // HTTP status code suggestion
  message: string;
}

/**
 * Validates the file type based on its extension.
 * @param file The file object to validate.
 * @returns FileValidationResult indicating if the type is valid and the detected type.
 */
function validateFileType(file: File): FileValidationResult {
  const fileName = file.name || "";
  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  if (!fileExtension) {
    return { isValid: false, type: null, extension: null, error: `Missing file extension for ${fileName}` };
  }

  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      type: null,
      extension: fileExtension,
      error: `Unsupported file type (.${fileExtension}) for ${fileName}. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  let determinedType: string;
  switch (fileExtension) {
    case "pdf":
      determinedType = "pdf";
      break;
    case "doc":
    case "docx":
      determinedType = "word"; // Keep internal type for metadata
      break;
    case "txt":
      determinedType = "txt";
      break;
    default:
      determinedType = "unknown";
      break;
  }

  console.log(`Validated type for ${fileName}: ${determinedType} (.${fileExtension})`);
  return { isValid: true, type: determinedType, extension: fileExtension, error: null };
}

export async function handleFileUpload(
  userId: string,
  files: File[],
  memoryName: string // Added memoryName parameter
): Promise<FileUploadResult> {
  let uploadedFileCount = 0;
  const errors: string[] = [];
  const processedFileCount = files.length;

  for (const file of files) {
    // Basic check
    if (!(typeof file === "object" && typeof file.arrayBuffer === "function" && typeof file.name === "string")) {
      console.warn("Encountered an invalid file entry:", file);
      errors.push(`Invalid file entry encountered.`);
      continue;
    }

    // Validate file type
    const validationResult = validateFileType(file);
    if (!validationResult.isValid || !validationResult.extension) {
      errors.push(validationResult.error || `Invalid type for file ${file.name}`);
      continue;
    }

    const contentType = EXT_TO_MIME_TYPE[validationResult.extension];
    if (!contentType) {
      errors.push(`Internal error: Could not determine MIME type for validated extension ${validationResult.extension} of file ${file.name}`);
      continue;
    }

    // Proceed with Langbase upload
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      console.log(`Uploading ${file.name} (as ${contentType}) to Langbase memory: ${memoryName}...`);

      const uploadResult = await langbaseClient.memories.documents.upload({
        memoryName: memoryName, // Use parameter
        contentType: contentType,
        documentName: file.name,
        document: buffer,
        meta: {
          userId: userId,
          originalFilename: file.name,
          detectedType: validationResult.type ?? "unknown",
        },
      });

      if (uploadResult.ok) {
        console.log(`Successfully uploaded ${file.name} to Langbase memory '${memoryName}'.`);
        uploadedFileCount++;
      } else {
        // Langbase upload failed
        const errorDetail = `Langbase upload failed for ${file.name} to memory '${memoryName}'. Status: ${uploadResult.status}, StatusText: ${uploadResult.statusText}`;
        console.error(errorDetail, uploadResult); // Log the full result for debugging
        errors.push(`Failed to upload ${file.name}: Langbase API error.`); // Simplified error message
      }
    } catch (uploadError: any) {
      console.error(`Error during upload process for file ${file.name}:`, uploadError);
      errors.push(`Error processing ${file.name}: ${uploadError.message || "Unknown error"}`);
    }
  }

  // Determine overall outcome based on errors and uploads
  if (errors.length > 0) {
    const errorMessage = `Processed ${processedFileCount} files for memory '${memoryName}'. Uploaded ${uploadedFileCount}. Errors/Skipped: ${errors.join(
      "; "
    )}`;
    if (uploadedFileCount > 0 && uploadedFileCount < processedFileCount) {
      // Partial success
      return { success: true, processedFileCount, uploadedFileCount, errors, status: 207, message: errorMessage };
    } else if (uploadedFileCount === processedFileCount) {
      // All processed files uploaded, but other errors occurred
      return {
        success: true,
        processedFileCount,
        uploadedFileCount,
        errors,
        status: 200,
        message: `Successfully uploaded ${uploadedFileCount} file(s) to memory '${memoryName}', but encountered non-critical issues: ${errors.join("; ")}`,
      };
    } else {
      // Complete failure or only invalid/failed files
      const status = errors.every(
        (e) =>
          e.includes("Unsupported file type") || e.includes("Missing file extension") || e.includes("Langbase API error") || e.includes("Invalid file entry")
      )
        ? 400
        : 500;
      return { success: false, processedFileCount, uploadedFileCount: 0, errors, status: status, message: errorMessage };
    }
  }

  // Full success
  return {
    success: true,
    processedFileCount,
    uploadedFileCount,
    errors: [],
    status: 200,
    message: `Successfully uploaded ${uploadedFileCount} document(s) for user ${userId} to Langbase memory '${memoryName}'.`,
  };
}
