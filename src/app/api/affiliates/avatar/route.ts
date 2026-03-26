import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file  = form.get("file") as File | null;
    const email = typeof form.get("email") === "string" ? (form.get("email") as string).trim().toLowerCase() : "";

    if (!file || !email) {
      return NextResponse.json({ error: "Missing file or email" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, or WebP allowed" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify affiliate exists
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, code")
      .eq("email", email)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ error: "Partner account not found" }, { status: 404 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${affiliate.code}/photo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage bucket "avatars"
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[avatar] upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed. Check that the avatars storage bucket exists and is public." }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Save URL to affiliates table
    await supabase
      .from("affiliates")
      .update({ avatar_url: publicUrl })
      .eq("email", email);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[avatar] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
