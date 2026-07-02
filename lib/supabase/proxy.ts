import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * This does NOT enforce authentication here — route protection lives in
 * app/layout.tsx (Server Component) to avoid the known Next.js 16 proxy
 * redirect issue. We only refresh the session cookies so downstream
 * Server Components see a valid session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Calling getUser() refreshes the session if the access token is expired
  // and writes the refreshed cookies back to the response.
  await supabase.auth.getUser();

  return supabaseResponse;
}
