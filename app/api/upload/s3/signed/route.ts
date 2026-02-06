import { NextRequest, NextResponse } from "next/server";
import { generatePresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    const url = await generatePresignedGetUrl(key, 60 * 15); // 15 minutes

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
