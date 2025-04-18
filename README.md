"""# AI-Powered Job Application Autofill Tool (Concept Backend)

This project implements the backend API for an AI copilot concept. It uses Langbase to manage document memories and run Retrieval-Augmented Generation (RAG) agents. The goal is to provide a foundation for features like understanding user documents (e.g., resumes) and generating context-aware responses.

*(Note: The current implementation focuses on the Langbase backend integration. Frontend features like Puppeteer browser automation are not yet implemented.)*

---

## 🎯 Features (Current Backend)

- **User-Specific Memory**: Create and manage separate Langbase vector memories per user.
- **Document Upload**: Upload documents (PDF, DOCX, TXT) to a user's Langbase memory. Langbase handles ingestion, chunking, and embedding.
- **Agent Pipe Creation**: Define and create user-specific agent pipes in Langbase.
- **RAG Agent Querying**: Send queries to a user's agent pipe. The pipe retrieves relevant context from the user's memory via Langbase RAG and generates a cited response using an underlying LLM.
- **API Documentation**: Swagger UI for exploring the available API endpoints.

---

## 🧱 Tech Stack

- **Framework**: Next.js (API Routes)
- **AI/RAG Platform**: [Langbase](https://langbase.com/) (Handles Memory, Embeddings, RAG, Agent Pipes, LLM interaction)
- **Language**: TypeScript
- **API Documentation**: Swagger / `next-swagger-doc`

*(Note: Puppeteer, noVNC, WebSocket components from the original concept are not part of the current implementation.)*

---

## 📁 Folder Structure

```
.
├── .env.local          # Local environment variables (API Keys, etc.) - DO NOT COMMIT
├── .git/               # Git directory
├── .gitignore          # Files ignored by Git
├── .next/              # Next.js build output
├── components.json     # Configuration for UI components (e.g., shadcn/ui)
├── documents/          # Stores uploaded user documents (e.g., resumes) - SHOULD BE GITIGNORED
├── drizzle.config.ts   # Drizzle ORM configuration (if used)
├── eslint.config.mjs   # ESLint configuration
├── node_modules/       # Project dependencies
├── next-env.d.ts       # Next.js TypeScript environment definitions
├── next.config.ts      # Next.js configuration
├── package-lock.json   # Exact dependency versions
├── package.json        # Project metadata and dependencies
├── postcss.config.mjs  # PostCSS configuration
├── public/             # Static assets (images, fonts, etc.)
├── README.md           # This file
├── src/                # Main application source code
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API route handlers
│   │   │   ├── agent/
│   │   │   │   └── query/
│   │   │   │       └── route.ts      # RAG Agent query endpoint
│   │   │   ├── memories/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.ts      # Create Langbase Memory endpoint
│   │   │   │   └── upload/
│   │   │   │       ├── route.ts      # Upload document to Memory endpoint
│   │   │   │       └── uploadHandler.ts # Logic for validation and Langbase upload
│   │   │   ├── pipes/
│   │   │   │   └── create/
│   │   │   │       └── route.ts      # Create Langbase Pipe endpoint
│   │   │   ├── hello/
│   │   │   │   └── route.ts      # Example/test API route
│   │   │   └── doc/
│   │   │       └── route.ts      # Serves Swagger JSON spec
│   │   ├── api-doc/      # Page for displaying Swagger UI
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout component
│   │   └── page.tsx      # Main application page component
│   └── lib/            # Shared libraries, utilities, configuration
│       ├── db/           # Database related files (e.g., schema, migrations - if using Drizzle)
│       ├── langbaseClient.ts # Shared Langbase SDK client instance
│       ├── swagger.ts    # Swagger definition generation
│       └── utils.ts      # General utility functions
└── tsconfig.json       # TypeScript configuration
```

---

## Getting Started

First, set up your environment variables by creating a `.env.local` file in the root directory:

```bash
# cp .env.example .env.local # If you have an example file
touch .env.local
```

Add your Langbase API key (and OpenAI key if Langbase uses it indirectly):

```dotenv
# .env.local
LANGBASE_API_KEY=your_langbase_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here # Potentially needed by Langbase

# Add other variables as needed...
```

Then, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. You won't see a UI for the API functionality, but the server will be running.

## API Documentation (Swagger)

Use the Swagger UI to interact with the backend API:

1.  Ensure the development server is running (`npm run dev`).
2.  Navigate to `/api-doc` in your browser (e.g., `http://localhost:3000/api-doc`).

From the Swagger UI, you can:
- Create a memory for a `userId` (`POST /api/memories/create`).
- Upload documents to that `userId`'s memory (`POST /api/memories/upload`).
- Create an agent pipe for that `userId` (`POST /api/pipes/create`).
- Query the agent (`POST /api/agent/query`).

The Swagger specification JSON is served at `/api/doc`.
"""
