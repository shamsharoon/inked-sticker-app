import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards({ data }: { data: any[] }) {
  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-4 lg:px-6 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader className="relative pb-2 sm:pb-4">
          <CardDescription className="text-xs sm:text-sm">
            Total Designs
          </CardDescription>
          <CardTitle className="text-xl sm:text-2xl @[250px]/card:text-3xl font-semibold tabular-nums">
            {data.length}
          </CardTitle>
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs sm:text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing design library <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            AI-generated designs this month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative pb-2 sm:pb-4">
          <CardDescription className="text-xs sm:text-sm">
            Orders This Month
          </CardDescription>
          <CardTitle className="text-xl sm:text-2xl @[250px]/card:text-3xl font-semibold tabular-nums">
            {
              data.filter(
                (order) =>
                  order.createdAt >
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length
            }
            {/* TODO: #12 add the createdAt data to the orders page */}
          </CardTitle>
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingDownIcon className="size-3" />
              -20%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs sm:text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Seasonal dip expected <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Customer orders need boost
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative pb-2 sm:pb-4">
          <CardDescription className="text-xs sm:text-sm">
            Success Rate
          </CardDescription>
          <CardTitle className="text-xl sm:text-2xl @[250px]/card:text-3xl font-semibold tabular-nums">
            {(
              (data.filter((order) => order.status === "success").length /
                data.length) *
              100
            ).toFixed(2)}
            %{/* TODO: #12 add the status data to the orders page */}
          </CardTitle>
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs sm:text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium">
            AI performance excellent <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            High quality generation rate
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative pb-2 sm:pb-4">
          <CardDescription className="text-xs sm:text-sm">
            Average Time to Complete
          </CardDescription>
          <CardTitle className="text-xl sm:text-2xl @[250px]/card:text-3xl font-semibold tabular-nums">
            1 m{/* TODO: #12 add the timeToComplete data to the orders page */}
          </CardTitle>
          <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />+ 3%
              {/* TODO: #12 add the timeToComplete data to the orders page */}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-xs sm:text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fast generation speed <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Quick turnaround times</div>
        </CardFooter>
      </Card>
    </div>
  );
}
