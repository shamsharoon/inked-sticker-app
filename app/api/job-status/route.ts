import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { message: "Job ID is required" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: job, error } = await supabase
    .from("jobs")
    .select("status, result_url, error_msg, prompt")
    .eq("id", jobId)
    .single();

  if (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
