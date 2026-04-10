import { NextResponse } from "next/server";

// Email digest removed. This endpoint is kept for backwards compatibility.
export async function POST() {
  return NextResponse.json({ sent: 0 });
}
