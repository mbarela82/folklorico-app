import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Initialize the response
  // We need to create a response object first so we can attach cookies to it later
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Setup Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Check Auth Status
  // We use getUser() to validate the session against Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Define Route Rules
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const publicPaths = ["/login", "/join-troupe", "/update-password", "/"];

  // ROBUST CHECK: strictly check if the path is exactly one of the public paths
  // OR if it starts with a public path + slash (e.g. /update-password/some-token)
  const isPublic = publicPaths.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  // --- SECURITY LOGIC ---

  // Scenario A: User is NOT logged in, but tries to visit a private page
  if (!user && !isPublic) {
    url.pathname = "/login";
    // Explicitly clear query params so we don't carry over confusing redirect data
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Scenario B: User IS logged in, but tries to visit Login or Join page
  // (We don't want them to login again if they are already in)
  if (user && (path === "/login" || path === "/join-troupe")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Scenario C: User visits Root "/"
  // If logged in -> Dashboard. If not -> Let the Splash Screen (page.tsx) handle it.
  if (path === "/") {
    if (user) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // If no user, we let the request proceed to the Splash Screen (which is public)
    return response;
  }

  // Allow the request to proceed
  return response;
}

// CONFIG: Tell Next.js which paths to run this middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (API routes used for auth exchange)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
