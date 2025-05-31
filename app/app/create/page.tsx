"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Wand2, X } from "lucide-react";

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  const [quantity, setQuantity] = useState(50);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          prompt,
          width,
          height,
          quantity,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Call API to generate designs with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let response;

      while (retryCount < maxRetries) {
        try {
          response = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: order.id,
              prompt,
              width,
              height,
              quantity,
            }),
          });

          // Check if response is ok and has valid JSON
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
              errorData?.error || `HTTP error! status: ${response.status}`
            );
          }

          const responseData = await response.json();

          // Validate the response data
          if (!responseData.success) {
            throw new Error(responseData.error || "API call failed");
          }

          // If we get here, the API call was successful
          break;
        } catch (error: any) {
          retryCount++;
          if (retryCount === maxRetries) {
            // Update order status to failed if all retries failed
            await supabase
              .from("orders")
              .update({ status: "failed" })
              .eq("id", order.id);
            throw new Error(
              `Failed to generate designs after ${maxRetries} attempts: ${
                error.message || "Unknown error"
              }`
            );
          }
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }

      // Update order status to generating after successful API call
      await supabase
        .from("orders")
        .update({ status: "generating" })
        .eq("id", order.id);

      // Upload files to Supabase Storage after design generation
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${order.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("uploads")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Save file reference in database
          await supabase.from("uploaded_images").insert({
            order_id: order.id,
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
          });
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Success!",
        description:
          "Your sticker designs are being generated. Redirecting to results...",
      });

      router.push(`/app/results?orderId=${order.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create sticker order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create Custom Stickers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Describe your vision and upload reference images to generate unique
          sticker designs
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-slate-900 dark:text-white">
            Design Details
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Provide details about the stickers you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="prompt"
                className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
              >
                Design Prompt
              </Label>
              <Textarea
                id="prompt"
                placeholder="Describe your sticker design in detail... (e.g., 'A cute cartoon cat wearing sunglasses with a rainbow background')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                required
                className="text-sm sm:text-base border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="width"
                  className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
                >
                  Width (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  min="100"
                  max="1000"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  required
                  className="text-sm sm:text-base border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="height"
                  className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
                >
                  Height (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="1000"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  required
                  className="text-sm sm:text-base border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="quantity"
                className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
              >
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="text-sm sm:text-base border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="files"
                className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
              >
                Reference Images (Optional)
              </Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 sm:p-6 text-center bg-slate-50 dark:bg-slate-800/50">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Upload images to help guide the AI generation
                </p>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("files")?.click()}
                  className="text-sm sm:text-base border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Choose Files
                </Button>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Selected files:
                  </p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-none">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Designs...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Designs
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
