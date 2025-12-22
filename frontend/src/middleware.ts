import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
  // We use getUser() because it validates the JWT with the database (secure)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Define Route Rules
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Pages that ANYONE can see (Logged in or not)
  const publicPaths = ["/login", "/join-troupe", "/update-password", "/"];

  // Is this page public?
  const isPublic = publicPaths.includes(path);

  // --- SECURITY LOGIC ---

  // Scenario A: User is NOT logged in, but tries to visit a private page
  if (!user && !isPublic) {
    // Redirect to login
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Scenario B: User IS logged in, but tries to visit Login or Join page
  // (We don't want them to login again if they are already in)
  if (user && (path === "/login" || path === "/join-troupe")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Scenario C: User visits Root "/"
  // If logged in -> Dashboard. If not -> Login.
  if (path === "/") {
    if (user) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    } else {
      // Let the Splash Screen component handle the visual loading/redirect
      // or force a redirect here. The splash screen (page.tsx) logic is fine,
      // so we can just let it pass through.
      return response;
    }
  }

  return response;
}

// CONFIG: Tell Next.js which paths to run this middleware on
// frontend/src/middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (Service Worker - CRITICAL)
     * - workbox- (Workbox Files - CRITICAL)
     * - manifest.webmanifest (Manifest - CRITICAL)
     * - auth/callback (Supabase Auth)
     * - images (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-|manifest.webmanifest|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
