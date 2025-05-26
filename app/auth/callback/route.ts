import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth error:", error);
        return NextResponse.redirect(new URL("/signin", requestUrl.origin));
      }
    }

    // Successful authentication, redirect to app
    return NextResponse.redirect(new URL("/app", requestUrl.origin));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}
