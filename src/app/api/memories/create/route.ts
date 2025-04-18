import { NextRequest, NextResponse } from "next/server";
import { langbaseClient } from "@/lib/langbaseClient";
import { EmbeddingModels } from "langbase";

// Default for embedding model only
const DEFAULT_EMBEDDING_MODEL: EmbeddingModels = "openai:text-embedding-3-large";
// Default description can also be used if description is not required from user
const DEFAULT_MEMORY_DESCRIPTION = "User-specific knowledge base";

/**
 * @swagger
 * /api/memories/create:
 *   post:
 *     summary: Creates a User-Specific Langbase Memory
 *     description: Creates a new Langbase memory named after the provided userId.
 *     tags:
 *       - Memories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The unique ID for the user, used as the memory name.
 *                 example: "e1f23b9b-d89a-4aa7-8a44-bcecaadca679"
 *               description:
 *                 type: string
 *                 description: (Optional) A description for the memory.
 *                 default: "User-specific knowledge base"
 *     responses:
 *       201:
 *         description: Memory created successfully.
 *       400:
 *         description: Bad Request (e.g., missing userId).
 *       409:
 *         description: Memory for this userId already exists.
 *       500:
 *         description: Internal Server Error or Langbase API error.
 */
export async function POST(req: NextRequest) {
  let userId: string;
  let description: string;

  try {
    const body = await req.json();
    if (!body.userId || typeof body.userId !== "string" || body.userId.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid required field: userId (must be a non-empty string)." }, { status: 400 });
    }
    userId = body.userId.trim();
    description =
      typeof body.description === "string" && body.description.trim() !== "" ? body.description.trim() : `${DEFAULT_MEMORY_DESCRIPTION} for ${userId}`;
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const memoryName = userId; // Use userId as the memory name
  console.log(`Attempting to create Langbase memory: ${memoryName}`);

  try {
    const memory = await langbaseClient.memories.create({
      name: memoryName,
      description: description,
      embedding_model: DEFAULT_EMBEDDING_MODEL,
    });

    console.log(`Memory '${memoryName}' created successfully.`);
    return NextResponse.json({ message: `Memory '${memoryName}' created successfully.`, memory }, { status: 201 });
  } catch (error: any) {
    const errorMessage = String(error?.message || "").toLowerCase();
    console.error(`Error creating Langbase memory '${memoryName}':`, error);

    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      return NextResponse.json({ message: `Memory '${memoryName}' already exists.` }, { status: 409 });
    }

    return NextResponse.json({ error: `Failed to create memory '${memoryName}': ${error?.message || "Unknown error"}` }, { status: 500 });
  }
}
