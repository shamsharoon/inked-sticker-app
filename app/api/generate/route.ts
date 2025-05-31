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

export async function POST(request: NextRequest) {
  try {
    const { orderId, prompt, width, height, quantity } = await request.json();

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verify the order exists and belongs to the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start the generation process immediately and return response
    generateDesigns(orderId, prompt, user.id, supabase).catch((error) => {
      console.error("Generation error:", error);
      // Update order status to failed if there was an error
      supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId)
        .catch(console.error);
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

    // Generate images using GPT Image with timeout
    const response = await Promise.race([
      openai.images.generate({
        model: "gpt-image-1",
        prompt,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Image generation timed out")), 30000)
      ),
    ]);

    if (!response.data || response.data.length === 0) {
      throw new Error("No images generated");
    }

    // Process images in parallel with chunking for better performance
    const CHUNK_SIZE = 2;
    const chunks = [];
    for (let i = 0; i < response.data.length; i += CHUNK_SIZE) {
      chunks.push(response.data.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const designInserts = await Promise.all(
        chunk.map(async (image: { b64_json?: string }, index: number) => {
          const filename = `design_${orderId}_${Date.now()}_${index}.png`;
          const filePath = `${userId}/${orderId}/${filename}`;

          // Convert base64 to buffer and upload to Supabase Storage
          const imageBytes = Buffer.from(image.b64_json!, "base64");
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

          // Return the database entry
          return {
            order_id: orderId,
            image_url: publicUrl,
            openai_image_id: `gpt_image_${Date.now()}_${index}`,
          };
        })
      );

      const { error: designError } = await supabase
        .from("designs")
        .insert(designInserts);

      if (designError) {
        throw designError;
      }
    }

    // Update order status to completed
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
  } catch (error) {
    console.error("Error in generateDesigns:", error);
    // Update order status to failed
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    throw error;
  }
}
