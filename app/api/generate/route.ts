import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server"; // Import the admin client
import OpenAI from "openai";
import { after } from "next/server";

// Configure the route to handle POST requests
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json(); // Accept only prompt
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new job record
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        // order_id is not passed here, will be null
        prompt: prompt,
        user_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job:", jobError);
      return NextResponse.json(
        { error: "Failed to create generation job" },
        { status: 500 }
      );
    }

    const jobId = job.id;

    // Schedule the design generation to run after the response is sent
    after(() => {
      // Use the admin client for the background task, as it runs detached
      // from the user's request context.
      generateDesigns(
        jobId,
        "placeholder-order",
        prompt,
        user.id,
        supabaseAdmin
      ).catch((error) => {
        console.error(`Error in background job ${jobId}:`, error);
      });
    });

    // Return a 202 Accepted response immediately
    return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
  } catch (error) {
    console.error("Request error:", error);
    // Return to a generic error message for production safety
    return NextResponse.json(
      { error: "Failed to start design generation" },
      { status: 500 }
    );
  }
}

async function generateDesigns(
  jobId: string,
  orderId: string, // This is now a placeholder
  prompt: string,
  userId: string,
  // The passed-in client is now the admin client
  supabase: typeof supabaseAdmin
) {
  try {
    // 1. Update job status to 'processing'
    await supabase
      .from("jobs")
      .update({ status: "processing" })
      .eq("id", jobId);

    const systemPrompt =
      "You are a professional graphic designer specializing in sticker design. Create a vibrant, eye-catching sticker based on this prompt: " +
      prompt +
      ". The design should be: 1) Vector-style with clean lines and shapes, 2) Highly detailed while maintaining visual clarity, 3) Suitable for sticker printing with well-defined edges, 4) Cohesive and balanced composition, 5) Using colors that work well together and create visual impact, 6) Incorporating any specific elements mentioned in the prompt while ensuring they fit the sticker format. The final design should be a single, self-contained image that would look appealing when printed as a sticker.";

    // 2. Generate image using OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: systemPrompt,
      response_format: "b64_json",
    });

    if (!response.data?.[0]?.b64_json) {
      throw new Error("No image data received from OpenAI");
    }

    const filename = `design_${orderId}_${Date.now()}.png`;
    const filePath = `${userId}/${orderId}/${filename}`;
    const imageBytes = Buffer.from(response.data[0].b64_json, "base64");

    // 3. Concurrent upload, DB insert, and original order update
    const {
      data: { publicUrl },
    } = supabase.storage.from("designs").getPublicUrl(filePath);

    await Promise.all([
      supabase.storage.from("designs").upload(filePath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      }),
      supabase.from("designs").insert({
        order_id: orderId,
        image_url: publicUrl,
        openai_image_id: `dalle3_${Date.now()}`,
      }),
      supabase.from("orders").update({ status: "completed" }).eq("id", orderId),
    ]);

    // 4. Mark job as complete
    await supabase
      .from("jobs")
      .update({ status: "complete", result_url: publicUrl })
      .eq("id", jobId);
  } catch (err) {
    console.error(`Failed to generate design for job ${jobId}:`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    // 5. On error, record and mark in both jobs and orders table
    await Promise.all([
      supabase
        .from("jobs")
        .update({ status: "error", error_msg: errorMessage })
        .eq("id", jobId),
      supabase.from("orders").update({ status: "failed" }).eq("id", orderId),
    ]);
  }
}
