export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/verification_results?verification_id=eq.${id}&select=readiness_score,kdp_ready`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );

  const rows = await res.json();
  const data = rows?.[0];
  const score  = data?.readiness_score ?? 0;
  const isPass = data?.kdp_ready === true || score >= 90;

  const base = "https://www.manu2print.com";
  const imageUrl = isPass
    ? `${base}/shells/shell_pass_ig.png`
    : `${base}/shells/shell_fail_ig.png`;

  // Redirect the OG crawler directly to the shell PNG
  return Response.redirect(imageUrl, 302);
}
