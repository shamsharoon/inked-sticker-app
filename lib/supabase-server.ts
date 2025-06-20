import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

/**
 * Creates a Supabase client for use in Server Components and API routes.
 * This client is authenticated based on the user's cookies.
 */
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

/**
 * Creates a Supabase admin client for privileged server-side operations.
 * This client uses the SERVICE_ROLE_KEY and bypasses RLS.
 * Use with caution.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
