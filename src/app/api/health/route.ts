import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { status: "ok", mode: process.env.AI_PROVIDER ?? "demo" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
