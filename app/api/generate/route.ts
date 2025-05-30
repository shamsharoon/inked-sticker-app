import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";
import OpenAI from "openai";

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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate images using GPT Image
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No images generated");
    }

    // Save images to Supabase Storage and prepare database entries
    const designInserts = await Promise.all(
      response.data.map(async (image, index) => {
        const filename = `design_${orderId}_${Date.now()}_${index}.png`;
        const filePath = `${user.id}/${orderId}/${filename}`;

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

    // Update order status to completed
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      designs: designInserts.length,
      message: "Designs generated successfully",
    });
  } catch (error) {
    console.error("Generation error:", error);

    // Update order status to failed if there was an error
    try {
      const body = await request.clone().json();
      const { orderId } = body;
      const supabase = createRouteHandlerClient<Database>({ cookies });
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);
    } catch (e) {
      console.error("Failed to update order status:", e);
    }

    return NextResponse.json(
      { error: "Failed to generate designs" },
      { status: 500 }
    );
  }
}
