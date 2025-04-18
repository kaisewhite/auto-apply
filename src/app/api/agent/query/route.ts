import { NextRequest, NextResponse } from "next/server";

// Force static for extension builds
export const dynamic = "force-static";
import { langbaseClient } from "@/lib/langbaseClient";
// Import correct types suggested by linter
import type { MemoryRetrieveResponse, RunResponse } from "langbase";

// --- Constants ---
const DEFAULT_MEMORY_NAME = "knowledge-base";
const DEFAULT_TOP_K = 4;
const DEFAULT_AGENT_PIPE_NAME = "ai-support-agent"; // Default pipe name

// --- Type Adjustments ---
// Assuming MemoryRetrieveResponse is the array of chunks itself or has a property like .chunks
// If MemoryRetrieveResponse is the array: type Chunk = MemoryChunk;
// If MemoryRetrieveResponse is an object { chunks: MemoryChunk[] }: type Chunk = MemoryChunk
// Need to know the actual structure of MemoryRetrieveResponse and its items (MemoryChunk?)
// Using a simplified placeholder for now based on usage:
type Chunk = { text: string; meta?: { originalFilename?: string; url?: string } };

// --- Helper Functions ---

async function runMemoryAgent(query: string, memoryName: string, topK: number): Promise<Chunk[]> {
  console.log(`Retrieving context for query: "${query}" from memory: ${memoryName}`);
  const retrieveResult: MemoryRetrieveResponse | any = await langbaseClient.memories.retrieve({
    query,
    topK,
    memory: [{ name: memoryName }],
  });
  return Array.isArray(retrieveResult) ? (retrieveResult as Chunk[]) : [];
}

async function getSystemPrompt(chunks: Chunk[]): Promise<string> {
  let chunksText = "";
  const sources: { [key: number]: string } = {};
  let sourceCounter = 1;

  for (const chunk of chunks) {
    const sourceName = chunk.meta?.originalFilename || "Unknown Source";
    let sourceId = Object.keys(sources).find((key) => sources[parseInt(key)] === sourceName);
    if (!sourceId) {
      sources[sourceCounter] = sourceName;
      sourceId = String(sourceCounter);
      sourceCounter++;
    }
    chunksText += `Chunk:\n${chunk.text}\nSource: [${sourceId}]\n---\n`;
  }

  let sourceList = "\nSources:\n";
  for (const id in sources) {
    sourceList += `[${id}] ${sources[id]}\n`;
  }

  const systemPrompt = `You're an AI assistant helping a user fill out job application forms.

You will be given a resume broken into context chunks. ONLY answer using the provided CONTEXT. Each chunk has a source noted at the end.

Your goal is to generate a short, accurate, and professional answer to each form field or question.

Respond in a way that would make sense if the user were typing this themselves in a form field.

NEVER fabricate information. If the answer cannot be found in the CONTEXT, say:
"I cannot answer this question based on the provided context."

When answering:
- Keep it brief and directly relevant to the question.
- Use full sentences only if required.
- DO NOT summarize the entire resume — just answer the specific question.
- DO NOT repeat the question in your response.

For every factual statement you make, cite the chunk source like this: [1].

At the end of your response, include a source list with the number and file name, like so: [1] resume.md.

CONTEXT:
---
${chunksText}
${sourceList}`;

  return systemPrompt;
}

// --- API Route Handler ---

/**
 * @swagger
 * /api/agent/query:
 *   post:
 *     summary: Queries a User-Specific RAG Agent
 *     description: >
 *       Sends a query to a user-specific AI agent pipe (identified by userId),
 *       retrieves relevant context from the user's memory (also identified by userId),
 *       and generates a response.
 *     tags:
 *       - Agents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - userId
 *             properties:
 *               query:
 *                 type: string
 *                 description: The user's query for the support agent.
 *                 example: "What is your most recent job title?"
 *               userId:
 *                 type: string
 *                 description: The unique ID for the user, used to identify the correct agent pipe and memory.
 *                 example: "e1f23b9b-d89a-4aa7-8a44-bcecaadca679"
 *               topK:
 *                 type: integer
 *                 description: (Optional) The maximum number of context chunks to retrieve.
 *                 default: 10
 *     responses:
 *       200:
 *         description: Successfully generated response from the agent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 contextChunks:
 *                   type: array
 *       400:
 *         description: Bad Request (e.g., missing query or userId, invalid topK).
 *       404:
 *         description: Agent Pipe or Memory not found for the given userId.
 *       500:
 *         description: Internal Server Error.
 */
export async function POST(req: NextRequest) {
  let query: string;
  let userId: string;
  let topK: number;

  // --- Parse Request Body ---
  try {
    const body = await req.json();

    if (!body.query || typeof body.query !== "string" || body.query.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid required field: query." }, { status: 400 });
    }
    query = body.query.trim();

    if (!body.userId || typeof body.userId !== "string" || body.userId.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid required field: userId." }, { status: 400 });
    }
    userId = body.userId.trim(); // Assign userId correctly

    topK = typeof body.topK === "number" && Number.isInteger(body.topK) && body.topK > 0 ? body.topK : DEFAULT_TOP_K;
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  // --- RAG Pipeline ---
  try {
    const memoryName = userId; // Use userId as memory name
    const pipeName = userId; // Use userId as pipe name

    // 1. Retrieve Context Chunks
    console.log(`Retrieving context for query: "${query}" from memory: ${memoryName}`);
    const chunks = await runMemoryAgent(query, memoryName, topK);

    if (chunks.length === 0) {
      console.log(`No relevant context found in memory '${memoryName}' for query.`);
    }

    // 2. Generate System Prompt with Context
    const systemPrompt = await getSystemPrompt(chunks);

    // 3. Run the LLM Pipe (Agent)
    console.log(`Running pipe '${pipeName}' for query: "${query}"`);
    const pipeResult = (await langbaseClient.pipes.run({
      stream: false,
      name: pipeName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    })) as RunResponse | { error: any; status?: number };

    // Check for errors specifically in the pipe run result
    if (!("completion" in pipeResult) || pipeResult.completion === null || pipeResult.completion === undefined) {
      console.error(`Error or no completion running pipe '${pipeName}':`, pipeResult);
      const errorMsg = (pipeResult as { error: any }).error?.message || pipeResult.toString() || "Failed to get completion from agent pipe.";
      let status = (pipeResult as { status?: number }).status || 500;
      if (String(errorMsg).toLowerCase().includes("not found")) {
        status = 404; // Not Found (could be pipe or memory)
      }
      return NextResponse.json({ error: errorMsg }, { status });
    }

    const completion = pipeResult.completion;

    console.log(`Agent response generated successfully from pipe '${pipeName}'.`);
    return NextResponse.json({ response: completion, contextChunks: chunks }, { status: 200 });
  } catch (error: any) {
    // Catch errors from runMemoryAgent or other unexpected issues
    console.error(`Error during RAG agent execution for userId "${userId}", query "${query}":`, error);
    return NextResponse.json({ error: `Agent execution failed: ${error?.message || "Unknown error"}` }, { status: 500 });
  }
}
