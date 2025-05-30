"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, ShoppingCart, Loader2, RefreshCw } from "lucide-react";
import Image from "next/image";

interface Order {
  id: string;
  prompt: string;
  width: number;
  height: number;
  quantity: number;
  status: string;
  created_at: string;
}

interface Design {
  id: string;
  image_url: string;
  openai_image_id: string | null;
}

export default function ResultsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) {
      router.push("/app");
      return;
    }

    fetchOrderAndDesigns();
  }, [orderId]);

  const fetchOrderAndDesigns = async () => {
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch designs
      const { data: designsData, error: designsError } = await supabase
        .from("designs")
        .select("*")
        .eq("order_id", orderId);

      if (designsError) throw designsError;
      setDesigns(designsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < designs.length; i++) {
      await downloadImage(designs[i].image_url, `sticker-design-${i + 1}.png`);
    }
    toast({
      title: "Success",
      description: "All designs downloaded!",
    });
  };

  const orderStickers = async () => {
    if (!order) return;

    setOrdering(true);
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          designs: designs.map((d) => d.image_url),
          size: { width: order.width, height: order.height },
          quantity: order.quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const result = await response.json();

      toast({
        title: "Order Placed!",
        description: `Your order has been submitted. Order ID: ${result.printPartnerOrderId}`,
      });

      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "ordered",
          print_partner_order_id: result.printPartnerOrderId,
        })
        .eq("id", order.id);

      router.push("/app/history");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Button onClick={() => router.push("/app")}>Back to Dashboard</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "generating":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      case "ordered":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            Design Results
          </h1>
          <p className="text-slate-700 dark:text-slate-500">
            Generated on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-700 dark:text-slate-300">
          <p>
            <strong>Prompt:</strong> {order.prompt}
          </p>
          <p>
            <strong>Dimensions:</strong> {order.width} × {order.height} px
          </p>
          <p>
            <strong>Quantity:</strong> {order.quantity} stickers
          </p>
        </CardContent>
      </Card>

      {order.status === "generating" && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p>Generating your designs...</p>
              <Button variant="outline" onClick={fetchOrderAndDesigns}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {designs.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Generated Designs
            </h2>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={downloadAll}
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Button
                onClick={orderStickers}
                disabled={ordering}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {ordering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Order Stickers
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design, index) => (
              <Card
                key={design.id}
                className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Design {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <Image
                      src={design.image_url || "/placeholder.svg"}
                      alt={`Design ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() =>
                      downloadImage(
                        design.image_url,
                        `sticker-design-${index + 1}.png`
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {order.status === "failed" && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">
              Failed to generate designs. Please try again.
            </p>
            <Button onClick={() => router.push("/app/create")}>
              Create New Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
