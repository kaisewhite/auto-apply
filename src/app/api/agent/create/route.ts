import { NextRequest, NextResponse } from "next/server";

// Force static for extension builds
export const dynamic = "force-static";
import { langbaseClient } from "@/lib/langbaseClient";

// Force static for extension builds

const PIPE_DESCRIPTION = "An AI agent to support users with their queries.";
const SYSTEM_PROMPT = `You're a helpful AI assistant.
You will assist users with their queries.
Always ensure that you provide accurate and to the point information.`;

/**
 * @swagger
 * /api/agent/create:
 *   post:
 *     summary: Creates a Langbase Pipe (Support Agent)
 *     description: Creates a new Langbase Pipe (agent) with a name derived from the user ID.
 *     tags:
 *       - Agents
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
 *                 description: The unique ID of the user for whom to create the agent/pipe. This will be used as the pipe name.
 *                 example: "e1f23b9b-d89a-4aa7-8a44-bcecaadca679"
 *     responses:
 *       201:
 *         description: Pipe (Agent) created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pipe 'e1f23b9b-d89a-4aa7-8a44-bcecaadca679' created successfully.
 *                 pipe:
 *                   type: object # Adjust based on actual Langbase response structure
 *       400:
 *         description: Bad Request (e.g., missing userId).
 *       409:
 *         description: Pipe with the specified name (userId) already exists.
 *       500:
 *         description: Internal Server Error or Langbase API error.
 */
export async function POST(req: NextRequest) {
  let userId: string;

  try {
    const body = await req.json();
    if (!body.userId || typeof body.userId !== "string" || body.userId.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid required field: userId (must be a non-empty string)." }, { status: 400 });
    }
    userId = body.userId.trim();
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const pipeName = userId; // Use userId as the pipe name
  console.log(`Attempting to create Langbase pipe: ${pipeName}`);

  try {
    const pipe = await langbaseClient.pipes.create({
      name: pipeName,
      description: PIPE_DESCRIPTION,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ],
      // Add other pipe configurations if needed (e.g., model, temperature)
    });

    console.log(`Pipe '${pipeName}' created successfully:`, pipe);
    return NextResponse.json({ message: `Pipe '${pipeName}' created successfully.`, pipe }, { status: 201 });
  } catch (error: any) {
    const errorMessage = String(error?.message || "").toLowerCase();
    console.error(`Error creating Langbase pipe '${pipeName}':`, error);

    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      return NextResponse.json({ message: `Pipe '${pipeName}' already exists.` }, { status: 409 });
    }

    return NextResponse.json({ error: `Failed to create pipe '${pipeName}': ${error?.message || "Unknown error"}` }, { status: 500 });
  }
}
