import { NextResponse } from "next/server";
import { loadPlaceholders } from "@/lib/placeholders";

export async function GET() {
  return NextResponse.json(loadPlaceholders());
}
