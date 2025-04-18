import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

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
 *        400:
 *          description: Bad Request (e.g., missing user_id, too many files, no files, invalid file type).
 *        500:
 *          description: Internal Server Error (e.g., failed to save files).
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const userId = formData.get("user_id");
  const files = formData.getAll("files"); // Use getAll for multiple files

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ error: "Cannot upload more than 5 files at a time." }, { status: 400 });
  }

  const userFolderPath = path.join(process.cwd(), "documents", userId);

  try {
    // Create user-specific directory if it doesn't exist
    await mkdir(userFolderPath, { recursive: true });

    let savedFileCount = 0;
    const errors = [];

    for (const file of files) {
      if (typeof file === "object" && "arrayBuffer" in file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(userFolderPath, file.name);
        try {
          await writeFile(filePath, buffer);
          savedFileCount++;
        } catch (writeError) {
          console.error(`Failed to save file ${file.name}:`, writeError);
          errors.push(`Failed to save ${file.name}`);
        }
      } else {
        errors.push(`Invalid file entry encountered.`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Completed with errors. Saved ${savedFileCount} files. Errors: ${errors.join(", ")}`;
      // Decide if partial success is acceptable or should return an error
      if (savedFileCount > 0) {
        return NextResponse.json({ message: errorMessage, savedFiles: savedFileCount }, { status: 207 }); // Multi-Status
      } else {
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        message: `Successfully uploaded ${savedFileCount} document(s) for user ${userId}`,
        savedFiles: savedFileCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing file upload:", error);
    return NextResponse.json({ error: "Internal server error during file upload." }, { status: 500 });
  }
}
