import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";

/** Logged-in users: purchase history lives under Dashboard → Settings. Others: email verification on /account. */
export default async function MyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    redirect("/dashboard?tab=settings&orders=1");
  }
  redirect("/account");
}
