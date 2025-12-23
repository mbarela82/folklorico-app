import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // --- EMERGENCY EXIT (PWA FIX) ---
  // Explicitly allow PWA files to pass through immediately.
  // This prevents the "MIME type" error even if the matcher fails or caches weirdly.
  if (
    path.startsWith("/sw.js") ||
    path.startsWith("/workbox-") ||
    path.startsWith("/manifest.webmanifest")
  ) {
    return NextResponse.next();
  }

  // 1. Initialize the response
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Define Route Rules
  // Pages that ANYONE can see (Logged in or not)
  const publicPaths = ["/login", "/join-troupe", "/update-password", "/"];

  // Is this page public?
  const isPublic = publicPaths.includes(path);

  // --- SECURITY LOGIC ---

  // Scenario A: User is NOT logged in, but tries to visit a private page
  if (!user && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Scenario B: User IS logged in, but tries to visit Login or Join page
  if (user && (path === "/login" || path === "/join-troupe")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Scenario C: User visits Root "/"
  if (path === "/") {
    if (user) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    // If not logged in, just let them see the splash screen (page.tsx)
    return response;
  }

  return response;
}

// CONFIG
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico
     * - PWA files: sw.js, workbox-*, manifest.webmanifest
     * - Supabase auth callback
     * - Standard image files
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-|manifest.webmanifest|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
