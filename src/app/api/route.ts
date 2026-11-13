import { NextResponse } from "next/server";

// Mark this route as statically renderable so it is compatible with
// `output: "export"` (GitHub Pages static hosting).
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}