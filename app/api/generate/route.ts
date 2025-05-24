import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { orderId, prompt, width, height, quantity } = await request.json()

    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Verify the order exists and belongs to the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // TODO: Replace with actual OpenAI API call
    // For now, we'll simulate the generation process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate mock designs (replace with actual OpenAI DALL-E integration)
    const mockDesigns = [
      "https://picsum.photos/400/400?random=1",
      "https://picsum.photos/400/400?random=2",
      "https://picsum.photos/400/400?random=3",
    ]

    // Save generated designs to database
    const designInserts = mockDesigns.map((imageUrl) => ({
      order_id: orderId,
      image_url: imageUrl,
      openai_image_id: `mock_${Date.now()}_${Math.random()}`,
    }))

    const { error: designError } = await supabase.from("designs").insert(designInserts)

    if (designError) {
      throw designError
    }

    // Update order status to completed
    await supabase.from("orders").update({ status: "completed" }).eq("id", orderId)

    return NextResponse.json({
      success: true,
      designs: designInserts.length,
      message: "Designs generated successfully",
    })
  } catch (error) {
    console.error("Generation error:", error)

    // Update order status to failed if there was an error
    try {
      const body = await request.clone().json()
      const { orderId } = body
      const supabase = createRouteHandlerClient<Database>({ cookies })
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId)
    } catch (e) {
      console.error("Failed to update order status:", e)
    }

    return NextResponse.json({ error: "Failed to generate designs" }, { status: 500 })
  }
}
