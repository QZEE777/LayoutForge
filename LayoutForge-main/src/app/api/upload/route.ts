import { NextRequest, NextResponse } from "next/server";
import { validateUpload, detectFileType, sanitizeFileName } from "@/lib/uploadValidation";
import { getClientIp, checkRateLimit } from "@/lib/rateLimit";
import { saveUpload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Maximum 10 uploads per minute. Please try again in ${Math.ceil(
            (rateLimit.resetAt - Date.now()) / 1000
          )} seconds.`,
        },
        { status: 429 }
      );
    }

    // Parse form data (may fail if body is too large — keep files under 50MB)
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not parse form data.";
      return NextResponse.json(
        {
          error: "Invalid request",
          message: msg.includes("size") || msg.includes("limit")
            ? "File is too large. Use a file under 50MB."
            : "Could not read upload. Try a smaller file or try again.",
        },
        { status: 400 }
      );
    }

    // Get file from form
    const fileEntry = formData.get("file");
    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          error: "No file",
          message: "Please provide a file with field name 'file'.",
        },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateUpload(fileEntry);
    if (!validation.valid && validation.error) {
      return NextResponse.json(
        {
          error: validation.error.code,
          message: validation.error.message,
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save upload
    let stored;
    try {
      stored = await saveUpload(buffer, fileEntry.name, fileEntry.type);
    } catch (e) {
      console.error("Save upload error:", e);
      const msg = e instanceof Error ? e.message : "Could not save file.";
      return NextResponse.json(
        { error: "Save failed", message: msg },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        id: stored.id,
        filename: stored.originalName,
        size: buffer.length,
        type: detectFileType(fileEntry.name, fileEntry.type),
        mimeType: fileEntry.type,
        createdAt: stored.createdAt,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
