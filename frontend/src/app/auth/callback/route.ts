import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  if (code) {
    // Sets the auth cookies for the user
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Decide where to go
  let dest = next || (type === "recovery" ? "/update-password" : "/dashboard");
  // Safety: only allow internal redirects
  if (!dest.startsWith("/")) dest = "/dashboard";

  return NextResponse.redirect(new URL(dest, url.origin));
}
