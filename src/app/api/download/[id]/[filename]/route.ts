import { NextRequest, NextResponse } from "next/server";
import { readOutput } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params;

    // Validate inputs
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing ID", message: "Please provide a file ID." },
        { status: 400 }
      );
    }

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "Missing filename", message: "Please provide a filename." },
        { status: 400 }
      );
    }

    // Security: Only allow PDF and EPUB files
    let contentType: string;
    if (filename.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (filename.endsWith(".epub")) {
      contentType = "application/epub+zip";
    } else {
      return NextResponse.json(
        { error: "Invalid file", message: "Only PDF and EPUB files can be downloaded." },
        { status: 400 }
      );
    }

    // Read the file
    const buffer = await readOutput(id, filename);
    if (!buffer) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "File not found or has expired.",
        },
        { status: 404 }
      );
    }

    // Return file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e) {
    console.error("Download route error:", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
