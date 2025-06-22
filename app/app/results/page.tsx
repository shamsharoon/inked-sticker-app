"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, Loader2, ServerCrash } from "lucide-react";
import Image from "next/image";

// Simplified interface for job status
interface Job {
  status: "pending" | "processing" | "complete" | "error";
  result_url?: string;
  error_msg?: string;
  prompt?: string;
}

export default function ResultsPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = searchParams.get("jobId");

  useEffect(() => {
    if (!jobId) {
      setJob({
        status: "error",
        error_msg: "No job ID provided. Please go back and try again.",
      });
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const pollJobStatus = async () => {
      try {
        const response = await fetch(`/api/job-status?jobId=${jobId}`);
        if (!response.ok) throw new Error("Server responded with an error");
        const data: Job = await response.json();

        if (!isCancelled) {
          setJob(data);
          setLoading(false);

          // Continue polling only if job is not complete or error
          if (data.status !== "complete" && data.status !== "error") {
            setTimeout(pollJobStatus, 2000);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setJob({
            status: "error",
            error_msg: "Failed to connect to the server.",
          });
          setLoading(false);
        }
      }
    };

    pollJobStatus();

    return () => {
      isCancelled = true;
    };
  }, [jobId]);

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
        description: "Failed to download image.",
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
        description: "Failed to copy image to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="w-12 h-12 animate-spin text-slate-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Generating your masterpiece...
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          This can take up to a minute. Please wait.
        </p>
      </div>
    );
  }

  if (job?.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ServerCrash className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-600">Generation Failed</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">
          {job.error_msg || "An unknown error occurred."}
        </p>
        <Button onClick={() => router.push("/app/create")} className="mt-6">
          Try Again
        </Button>
      </div>
    );
  }

  if (job?.status === "complete" && job.result_url) {
    const promptText = job.prompt || "your generated design";
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">Your Design is Ready!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square w-full relative bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Image
                src={job.result_url}
                alt={promptText}
                fill
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-800 dark:text-white">
                Prompt:
              </p>
              <p className="text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                {promptText}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  downloadImage(
                    job.result_url!,
                    `${promptText.substring(0, 20)}.png`
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCopyImage(job.result_url!)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Image
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for unexpected states
  return (
    <div className="text-center p-8">
      <p>Loading results...</p>
    </div>
  );
}
