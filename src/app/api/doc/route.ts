import { NextResponse } from "next/server";

// Force static for extension builds
export const dynamic = "force-static";
import { getApiDocs } from "@/lib/swagger";

export async function GET() {
  const spec = await getApiDocs();
  return NextResponse.json(spec);
}
