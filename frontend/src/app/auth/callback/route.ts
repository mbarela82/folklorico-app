import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const type = url.searchParams.get("type");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  let dest = next || (type === "recovery" ? "/update-password" : "/dashboard");
  if (!dest.startsWith("/")) dest = "/dashboard";

  return NextResponse.redirect(new URL(dest, url.origin));
}

// Block non-GETs explicitly
export async function POST() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
export async function PUT() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
export async function DELETE() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
