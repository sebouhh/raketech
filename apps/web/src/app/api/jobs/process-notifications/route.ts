import { NextResponse } from "next/server";

// Email notifications removed. This endpoint is kept for backwards compatibility.
export async function POST() {
  return NextResponse.json({ processed: 0 });
}
