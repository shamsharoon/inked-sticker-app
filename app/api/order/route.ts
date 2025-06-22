import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { orderId, quantity } = await request.json();

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

    // TODO: Replace with actual Printify API integration
    // For now, we'll simulate the order creation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockPrintPartnerOrderId = `PRINT_${Date.now()}`;
    const mockTotalCost = quantity * 2.5; // $2.50 per sticker

    // Update order with print partner details
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "ordered",
        print_partner_order_id: mockPrintPartnerOrderId,
        total_cost: mockTotalCost,
      })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      printPartnerOrderId: mockPrintPartnerOrderId,
      totalCost: mockTotalCost,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
