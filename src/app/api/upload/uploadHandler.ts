import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface FileUploadResult {
  success: boolean;
  savedFileCount: number;
  errors: string[];
  status: number; // HTTP status code suggestion
  message: string;
}

export async function handleFileUpload(userId: string, files: File[]): Promise<FileUploadResult> {
  const userFolderPath = path.join(process.cwd(), "documents", userId);
  let savedFileCount = 0;
  const errors: string[] = [];

  try {
    // Create user-specific directory if it doesn't exist
    await mkdir(userFolderPath, { recursive: true });

    for (const file of files) {
      // Basic check if it looks like a File object
      if (typeof file === "object" && typeof file.arrayBuffer === "function" && typeof file.name === "string") {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const filePath = path.join(userFolderPath, file.name);
          await writeFile(filePath, buffer);
          savedFileCount++;
        } catch (writeError: any) {
          console.error(`Failed to save file ${file.name}:`, writeError);
          errors.push(`Failed to save ${file.name}: ${writeError.message || "Unknown error"}`);
        }
      } else {
        console.warn("Encountered an invalid file entry:", file);
        errors.push(`Invalid file entry encountered.`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Completed with errors. Saved ${savedFileCount} out of ${files.length} files. Errors: ${errors.join(", ")}`;
      if (savedFileCount > 0) {
        // Partial success
        return { success: true, savedFileCount, errors, status: 207, message: errorMessage }; // 207 Multi-Status
      } else {
        // Complete failure
        return { success: false, savedFileCount: 0, errors, status: 500, message: errorMessage };
      }
    }

    // Full success
    return {
      success: true,
      savedFileCount,
      errors: [],
      status: 200,
      message: `Successfully uploaded ${savedFileCount} document(s) for user ${userId}`,
    };
  } catch (error: any) {
    console.error("Error creating directory or processing files:", error);
    errors.push(`Internal server error during file processing: ${error.message || "Unknown error"}`);
    return {
      success: false,
      savedFileCount: 0,
      errors,
      status: 500,
      message: "Internal server error during file upload.",
    };
  }
}
