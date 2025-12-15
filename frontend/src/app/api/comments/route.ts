import { createClient } from "@/lib/supabaseServer"; // Import the file we just made in Step 1
import { NextResponse } from "next/server";

// 1. GET: Fetch comments for a specific resource
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("resourceId");

  if (!resourceId)
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id, content, created_at, user_id,
      profiles ( display_name, avatar_url )
    `
    )
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

// 2. POST: Add a new comment
export async function POST(request: Request) {
  const supabase = await createClient();

  // Security Check: Who is logged in?
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, resourceId, resourceType } = body;

  // Insert the comment using the logged-in user's ID
  const { error } = await supabase.from("comments").insert({
    content,
    resource_id: resourceId,
    resource_type: resourceType,
    user_id: user.id, // <--- AUTO-FILLED FROM SESSION
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
