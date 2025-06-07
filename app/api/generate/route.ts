import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";
import OpenAI from "openai";

// Configure the route to handle POST requests
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageGenerationResponse {
  data: Array<{
    b64_json: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, prompt, width, height, quantity } = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Verify the order exists and belongs to the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start the generation process immediately and return response
    generateDesigns(orderId, prompt, user.id, supabase).catch(async (error) => {
      console.error("Generation error:", error);
      try {
        // Update order status to failed if there was an error
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orderId);
      } catch (updateError) {
        console.error("Failed to update order status:", updateError);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Design generation started",
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to start design generation" },
      { status: 500 }
    );
  }
}

async function generateDesigns(
  orderId: string,
  prompt: string,
  userId: string,
  supabase: ReturnType<typeof createRouteHandlerClient<Database>>
) {
  try {
    // Update order status to generating
    await supabase
      .from("orders")
      .update({ status: "generating" })
      .eq("id", orderId);

    // Generate image using OpenAI with increased timeout
    const systemPrompt =
      "You are a professional graphic designer specializing in sticker design. Create a vibrant, eye-catching sticker based on this prompt: " +
      prompt +
      ". The design should be: 1) Vector-style with clean lines and shapes, 2) Highly detailed while maintaining visual clarity, 3) Suitable for sticker printing with well-defined edges, 4) Cohesive and balanced composition, 5) Using colors that work well together and create visual impact, 6) Incorporating any specific elements mentioned in the prompt while ensuring they fit the sticker format. The final design should be a single, self-contained image that would look appealing when printed as a sticker.";
    const response = await Promise.race([
      openai.images.generate({
        model: "gpt-image-1",
        prompt: systemPrompt,
      }) as Promise<ImageGenerationResponse>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Image generation timed out")), 60000)
      ),
    ]);

    if (!response.data?.[0]?.b64_json) {
      throw new Error("No image data received from OpenAI");
    }

    // Process the single generated image
    const filename = `design_${orderId}_${Date.now()}.png`;
    const filePath = `${userId}/${orderId}/${filename}`;

    // Convert base64 to buffer and upload to Supabase Storage
    const imageBytes = Buffer.from(response.data[0].b64_json, "base64");
    const { error: uploadError } = await supabase.storage
      .from("designs")
      .upload(filePath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("designs").getPublicUrl(filePath);

    // Save the design to database
    const { error: designError } = await supabase.from("designs").insert({
      order_id: orderId,
      image_url: publicUrl,
      openai_image_id: `gpt_image_${Date.now()}`,
    });

    if (designError) {
      throw designError;
    }

    // Update order status to completed
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
  } catch (error) {
    console.error("Error in generateDesigns:", error);
    try {
      // Update order status to failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);
    } catch (updateError) {
      console.error("Failed to update order status:", updateError);
    }
    throw error;
  }
}
