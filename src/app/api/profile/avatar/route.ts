import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 503 });
    }

    const form = await req.formData();
    const file   = form.get("file") as File | null;
    const userId = typeof form.get("userId") === "string" ? (form.get("userId") as string).trim() : "";

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, or WebP allowed" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user exists
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `profiles/${userId}/photo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[profile/avatar] upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed. Check that the avatars storage bucket exists and is public." },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(storagePath);

    // Save URL to profiles table
    await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: publicUrl });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[profile/avatar] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
