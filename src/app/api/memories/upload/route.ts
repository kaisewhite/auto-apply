import { NextRequest, NextResponse } from "next/server";

// Force static for extension builds
export const dynamic = "force-static";
import { handleFileUpload } from "./uploadHandler"; // Import the handler

/**
 * @swagger
 * /api/memories/upload:
 *    post:
 *      summary: Uploads multiple documents (max 5) to a user-specific Langbase memory
 *      description: Uploads up to 5 documents (pdf, doc, docx, txt) to the Langbase memory associated with the provided userId.
 *      requestBody:
 *        required: true
 *        content:
 *          multipart/form-data:
 *            schema:
 *              type: object
 *              required:
 *                - userId # Require userId
 *                - files
 *              properties:
 *                userId:
 *                  type: string
 *                  description: The unique ID for the user. This determines the memory to upload to.
 *                  example: "e1f23b9b-d89a-4aa7-8a44-bcecaadca679"
 *                files:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                  description: "The document(s) to upload (max 5). Allowed types: pdf, doc, docx, txt."
 *      tags:
 *        - Memories
 *      responses:
 *        200:
 *          description: Successfully uploaded document(s).
 *        207:
 *           description: Multi-Status. Upload completed with some errors/skipped files.
 *        400:
 *          description: Bad Request (e.g., missing userId, missing files, too many files, invalid file type).
 *        500:
 *          description: Internal Server Error.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userIdValue = formData.get("userId"); // Changed from user_id for consistency with create route
    const fileEntries = formData.getAll("files");

    // --- Validation ---
    if (!userIdValue || typeof userIdValue !== "string" || userIdValue.trim() === "") {
      return NextResponse.json({ error: "User ID (userId) is required and must be a non-empty string." }, { status: 400 });
    }
    const userId = userIdValue.trim();
    const memoryName = userId; // Use userId as memory name

    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided under the 'files' key." }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "Cannot upload more than 5 files at a time." }, { status: 400 });
    }
    // --- End Validation ---

    console.log(`Upload request for user: ${userId}, memory: ${memoryName}, files: ${files.length}`);

    // Delegate the file handling logic, passing memoryName (which is userId)
    const result = await handleFileUpload(userId, files, memoryName);

    // Construct the response based on the handler's result
    const responseBody: { message: string; uploadedFiles?: number; processedFiles?: number; errors?: string[] } = {
      message: result.message,
      processedFiles: result.processedFileCount,
    };
    if (result.uploadedFileCount > 0) {
      responseBody.uploadedFiles = result.uploadedFileCount;
    }
    if (result.errors.length > 0) {
      responseBody.errors = result.errors;
    }

    return NextResponse.json(responseBody, { status: result.status });
  } catch (error) {
    console.error("Unhandled error in POST /api/memories/upload:", error);
    return NextResponse.json({ error: "An unexpected internal server error occurred." }, { status: 500 });
  }
}
