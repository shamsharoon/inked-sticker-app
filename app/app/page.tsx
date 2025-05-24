"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, History, Palette, Zap, MousePointerClick } from "lucide-react";
import Link from "next/link";

export default function AppDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
            Inked
          </span>
          , {user?.user_metadata?.full_name || "Creator"}!
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Generate custom stickers and order them in bulk. Turn your ideas into
          reality with just a few clicks
          <MousePointerClick className="inline-block h-5 w-5 text-blue-600 dark:text-blue-400 ml-1" />
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Create New Stickers</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Use AI to generate custom sticker designs from your prompts and
              images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/app/create">
                <Palette className="mr-2 h-4 w-4" />
                Start Creating
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Order History</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              View your past orders, download designs, and track order status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/app/history">
                <History className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900/50 dark:via-blue-950/50 dark:to-slate-800/50 rounded-lg p-8 text-center space-y-4 border border-slate-200 dark:border-slate-800">
        <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Powered by AI
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Our advanced AI technology transforms your creative ideas into
          professional-quality sticker designs. Simply describe what you want,
          upload reference images, and let our AI do the magic.
        </p>
      </div>
    </div>
  );
}
