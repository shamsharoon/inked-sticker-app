// TODO: #9 Fix React hooks error
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  prompt: string;
  status: string;
  created_at: string;
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, page]);

  const fetchJobs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("jobs")
        .select("id, prompt, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setJobs((prev) => (page === 1 ? data || [] : [...prev, ...(data || [])]));
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500"; // for 'pending'
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Generation History
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your past design generations
          </p>
        </div>
        <Button asChild size="sm" className="w-fit sm:w-auto">
          <Link href="/app/create">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create New Design</span>
            <span className="sm:hidden">New Design</span>
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">No history yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Start by creating your first custom sticker design!
              </p>
              <Button asChild size="sm">
                <Link href="/app/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Design
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Your Generations
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-4 p-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="border border-slate-200 dark:border-slate-700"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                          {truncateText(job.prompt, 40)}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(job.status)} ml-2 text-xs`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full text-xs"
                    >
                      <Link href={`/app/results?jobId=${job.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Results
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Date</TableHead>
                    <TableHead className="text-sm">Prompt</TableHead>
                    <TableHead className="text-sm">Status</TableHead>
                    <TableHead className="text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm">
                          {truncateText(job.prompt, 50)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(job.status)} text-xs`}
                        >
                          {job.status.charAt(0).toUpperCase() +
                            job.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/results?jobId=${job.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span className="hidden lg:inline">
                              View Results
                            </span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {hasMore && (
              <div className="text-center p-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
