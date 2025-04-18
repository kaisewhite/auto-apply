import { NextRequest, NextResponse } from "next/server";
import { handleFileUpload } from "./uploadHandler"; // Import the handler

/**
 * @swagger
 * /api/upload:
 *    post:
 *      summary: Uploads multiple documents (max 5)
 *      description: Uploads up to 5 documents to the server under a user-specific folder.
 *      requestBody:
 *        required: true
 *        content:
 *          multipart/form-data:
 *            schema:
 *              type: object
 *              properties:
 *                user_id:
 *                  type: string
 *                  description: The ID of the user uploading the documents.
 *                  example: "e1f23b9b-d89a-4aa7-8a44-bcecaadca679"
 *                files:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                  description: The document(s) to upload (max 5).
 *      tags:
 *        - users
 *      responses:
 *        200:
 *          description: Successfully uploaded document(s).
 *        207:
 *           description: Multi-Status. Upload completed with some errors.
 *        400:
 *          description: Bad Request (e.g., missing user_id, too many files, no files, invalid file type).
 *        500:
 *          description: Internal Server Error (e.g., failed to save files).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userIdValue = formData.get("user_id");
    const fileEntries = formData.getAll("files");

    // Basic validation remains in the route handler
    if (!userIdValue || typeof userIdValue !== "string") {
      return NextResponse.json({ error: "User ID is required and must be a string." }, { status: 400 });
    }
    const userId = userIdValue; // Assign to new const for clarity

    // Filter out non-File entries just in case
    const files = fileEntries.filter((entry): entry is File => entry instanceof File);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "Cannot upload more than 5 files at a time." }, { status: 400 });
    }

    // Delegate the file handling logic
    const result = await handleFileUpload(userId, files);

    // Construct the response based on the handler's result
    const responseBody: { message: string; savedFiles?: number; errors?: string[] } = {
      message: result.message,
    };
    if (result.savedFileCount > 0) {
      responseBody.savedFiles = result.savedFileCount;
    }
    if (result.errors.length > 0) {
      responseBody.errors = result.errors;
    }

    return NextResponse.json(responseBody, { status: result.status });
  } catch (error) {
    // Catch potential errors from req.formData() or other unexpected issues
    console.error("Unhandled error in POST /api/upload:", error);
    return NextResponse.json({ error: "An unexpected internal server error occurred." }, { status: 500 });
  }
}
