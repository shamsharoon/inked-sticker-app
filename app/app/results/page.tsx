"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Download, ShoppingCart, Loader2, RefreshCw, Copy } from "lucide-react";
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
  const [isPolling, setIsPolling] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const hasShownToast = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const orderId = searchParams.get("orderId");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push("/app");
      return;
    }

    // Initial fetch
    fetchOrderAndDesigns();

    // Set up polling only if order is not completed
    const interval = setInterval(() => {
      if (order?.status === "completed" || order?.status === "failed") {
        clearInterval(interval);
        return;
      }
      fetchOrderAndDesigns();
    }, 5000); // Increased to 5 seconds to reduce load

    setPollingInterval(interval);

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [orderId, order?.status]);

  const fetchOrderAndDesigns = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes

    setIsRefreshing(true);
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Update order state
      setOrder(orderData);
      setIsPolling(
        orderData.status === "generating" || orderData.status === "pending"
      );

      // If order is completed, fetch designs
      if (orderData.status === "completed") {
        const { data: designsData, error: designsError } = await supabase
          .from("designs")
          .select("*")
          .eq("order_id", orderId);

        if (designsError) throw designsError;

        // If we have designs, update the state and stop polling
        if (designsData && designsData.length > 0) {
          setDesigns(designsData);
          setIsPolling(false);

          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }

          // Check if we've already shown the toast for this order
          const toastKey = `toast-shown-${orderId}`;
          const hasShownToastForOrder = localStorage.getItem(toastKey);

          // Show success toast only if we haven't shown it for this specific order
          if (!hasShownToastForOrder && !hasShownToast.current) {
            toast({
              title: "Success",
              description: "Your designs are ready!",
            });
            hasShownToast.current = true;
            localStorage.setItem(toastKey, "true");
          }
        }
      } else if (orderData.status === "failed") {
        // Stop polling if the order failed
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsPolling(false);
        toast({
          title: "Error",
          description: "Failed to generate designs. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

  const handleCopyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      toast({
        title: "Success",
        description: "Image copied to clipboard!",
      });
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast({
        title: "Error",
        description: "Failed to copy image to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
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
      case "pending":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            Design Results
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-500">
            Generated on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={`${getStatusColor(order.status)} w-fit`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm sm:text-base text-slate-700 dark:text-slate-300">
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

      {order?.status === "pending" && (
        <Card>
          <CardContent className="flex items-center justify-center py-6 sm:py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto" />
              <p className="text-sm sm:text-base">
                Initializing design generation...
              </p>
              <Button
                variant="outline"
                onClick={fetchOrderAndDesigns}
                disabled={isRefreshing}
                size="sm"
                className="text-sm"
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order?.status === "generating" && (
        <Card>
          <CardContent className="flex items-center justify-center py-6 sm:py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto" />
              <p className="text-sm sm:text-base">Generating your designs...</p>
              <Button
                variant="outline"
                onClick={fetchOrderAndDesigns}
                disabled={isRefreshing}
                size="sm"
                className="text-sm"
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {designs.length > 0 && (
        <>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Generated Designs
            </h2>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={downloadAll}
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm sm:text-base"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Button
                onClick={orderStickers}
                disabled={ordering}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base"
                size="sm"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {designs.map((design, index) => (
              <Card
                key={design.id}
                className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-white">
                    Design {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
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
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden p-2 sm:p-6">
                      <DialogTitle className="sr-only">
                        Design {index + 1} Preview
                      </DialogTitle>
                      <div className="relative">
                        <img
                          src={design.image_url || "/placeholder.svg"}
                          alt={`Design ${index + 1}`}
                          className="w-full h-auto max-h-[80vh] sm:max-h-[70vh] object-contain rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={() =>
                                    downloadImage(
                                      design.image_url,
                                      `sticker-design-${index + 1}.png`
                                    )
                                  }
                                  className="bg-background/90 hover:bg-background border border-border shadow-lg h-8 w-8 sm:h-10 sm:w-10"
                                >
                                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download image</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={() =>
                                    handleCopyImage(design.image_url)
                                  }
                                  className="bg-background/90 hover:bg-background border border-border shadow-lg h-8 w-8 sm:h-10 sm:w-10"
                                >
                                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy image</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                    onClick={() =>
                      downloadImage(
                        design.image_url,
                        `sticker-design-${index + 1}.png`
                      )
                    }
                    size="sm"
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
          <CardContent className="text-center py-6 sm:py-8">
            <p className="text-red-600 mb-4 text-sm sm:text-base">
              Failed to generate designs. Please try again.
            </p>
            <Button onClick={() => router.push("/app/create")} size="sm">
              Create New Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
