import { NextRequest, NextResponse } from "next/server";
import { WebSocketServer, WebSocket } from "ws"; // Import ws
import type { Browser } from "puppeteer"; // Import Browser type

// --- WebSocket Server Setup (DEV ONLY - Not production safe) ---
let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();
const WS_PORT = 8080; // Choose a port different from Next.js and noVNC

function initializeWebSocketServer() {
  if (!wss) {
    console.log(`Initializing WebSocket server on port ${WS_PORT}...`);
    wss = new WebSocketServer({ port: WS_PORT });

    wss.on("connection", (ws) => {
      console.log("WebSocket client connected");
      clients.add(ws);

      ws.on("message", (message) => {
        // Handle incoming messages if needed (e.g., for bi-directional communication)
        console.log("Received message:", message.toString());
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
        clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        clients.delete(ws); // Clean up on error
      });
      ws.send(JSON.stringify({ type: "status", message: "WebSocket connection established." }));
    });

    wss.on("error", (error) => {
      console.error("WebSocket Server Error:", error);
      wss = null; // Allow re-initialization on error
    });

    console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
  }
  return wss;
}

// Initialize on module load (only works reliably in dev mode)
if (typeof window === "undefined") {
  initializeWebSocketServer();
}

function broadcast(type: string, message: string) {
  if (!wss) {
    console.warn("WebSocket server not initialized, cannot broadcast.");
    return;
  }
  const payload = JSON.stringify({ type, message });
  console.log(`Broadcasting WebSocket message: ${payload}`);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
// --- End WebSocket Setup ---

// --- Puppeteer Setup (DEV ONLY - Persistent Instance) ---
let puppeteer: typeof import("puppeteer") | null = null;
let browserInstance: Browser | null = null; // Store the persistent browser instance

async function getBrowserInstance(): Promise<Browser> {
  // Ensure puppeteer is loaded
  if (!puppeteer) {
    try {
      puppeteer = await import("puppeteer");
    } catch (err) {
      console.error("Failed to load puppeteer module:", err);
      broadcast("error", "Server error: Puppeteer module failed to load.");
      throw new Error("Puppeteer failed to load");
    }
  }

  if (!browserInstance || !browserInstance.isConnected()) {
    broadcast("status", "Launching new browser instance...");
    console.log("No existing browser instance found or connected, launching new one...");
    try {
      browserInstance = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      console.log("New browser instance launched.");
      broadcast("status", "Browser instance launched.");
      // Handle unexpected browser closure
      browserInstance.on("disconnected", () => {
        console.log("Persistent browser instance disconnected.");
        broadcast("error", "Browser session disconnected unexpectedly.");
        browserInstance = null;
      });
    } catch (launchError) {
      console.error("Failed to launch persistent browser:", launchError);
      broadcast("error", "Failed to launch browser process.");
      browserInstance = null; // Reset on failure
      throw launchError; // Re-throw to be caught by the main handler
    }
  } else {
    console.log("Using existing browser instance.");
    broadcast("status", "Using existing browser instance.");
  }
  return browserInstance;
}

// --- End Puppeteer Setup ---

/**
 * @swagger
 * /api/launch-browser:
 *   post:
 *     summary: Navigates the persistent browser session
 *     description: Connects to the existing persistent Puppeteer browser instance (launching if needed, dev only) and navigates its primary page to the specified URL.
 *     tags:
 *       - Browser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL to navigate the browser to.
 *                 format: url
 *                 example: "https://google.com"
 *     responses:
 *       200:
 *         description: Navigation initiated successfully.
 *       400:
 *         description: Bad Request (e.g., missing or invalid URL).
 *       500:
 *         description: Internal Server Error (e.g., failed to launch/connect browser or navigate).
 */
export async function POST(req: NextRequest) {
  if (typeof window !== "undefined") {
    return NextResponse.json({ error: "Server-side only." }, { status: 405 });
  }
  initializeWebSocketServer(); // Ensure WS server is running

  let url: string;
  try {
    const body = await req.json();
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "Missing/invalid field: url." }, { status: 400 });
    }
    try {
      new URL(body.url);
      url = body.url;
    } catch (_) {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  broadcast("status", `Received request to navigate to ${url}.`);

  try {
    const browser = await getBrowserInstance(); // Get or launch the single instance

    broadcast("status", "Accessing browser page...");
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage(); // Use first page or create one

    if (!page) {
      throw new Error("Could not get a browser page.");
    }

    broadcast("status", `Navigating page to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Added timeout

    console.log(`Navigation to ${url} complete.`);
    broadcast("success", `Successfully navigated to ${url}.`);

    return NextResponse.json({ success: true, message: `Navigation initiated for ${url}.` }, { status: 200 });
  } catch (error: any) {
    console.error("Error controlling browser or navigating:", error);
    const errorMsg = `Failed to navigate browser: ${error?.message || "Unknown error"}`;
    broadcast("error", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
