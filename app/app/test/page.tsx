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
import {
  History,
  Users,
  Settings,
  Package,
  BarChart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

const revenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 4500 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 5500 },
];

const orderData = [
  { name: "Mon", orders: 4 },
  { name: "Tue", orders: 3 },
  { name: "Wed", orders: 5 },
  { name: "Thu", orders: 2 },
  { name: "Fri", orders: 6 },
  { name: "Sat", orders: 4 },
  { name: "Sun", orders: 3 },
];

const userGrowthData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 500 },
  { name: "Mar", users: 600 },
  { name: "Apr", users: 700 },
  { name: "May", users: 800 },
  { name: "Jun", users: 900 },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Welcome back, {user?.user_metadata?.full_name || "Admin"}
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white text-sm">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                24
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pending Orders
              </p>
              <div className="h-[60px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orderData}>
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white text-sm">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                1,234
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Users
              </p>
              <div className="h-[60px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white text-sm">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Revenue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                $12,345
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Monthly Revenue
              </p>
              <div className="h-[60px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={revenueData}>
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                +23%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                vs Last Month
              </p>
              <div className="h-[60px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Revenue Overview</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Monthly revenue trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>User Growth</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              User acquisition over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Settings</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Configure system settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/app/settings">
                <Settings className="mr-2 h-4 w-4" />
                Manage Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Monitor system activity and logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/app/activity">
                <History className="mr-2 h-4 w-4" />
                View Activity
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
