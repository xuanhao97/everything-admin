// Purpose: Admin dashboard page with analytics demo
// - Displays key metrics and statistics
// - Shows overview cards with demo data
// - Provides quick insights into system status

import { Calendar, Clock, FileText, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Purpose: Stat card component for displaying metrics
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <p
            className={`text-xs mt-2 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Base Admin. Here's an overview of your system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="1,234"
          description="Active users in the system"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatCard
          title="Pending Requests"
          value="23"
          description="Timeoff requests awaiting approval"
          icon={<FileText className="h-4 w-4" />}
          trend={{ value: "+5.2%", isPositive: false }}
        />
        <StatCard
          title="This Month"
          value="156"
          description="Timeoff requests this month"
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: "+8.1%", isPositive: true }}
        />
        <StatCard
          title="Avg Response Time"
          value="2.4 days"
          description="Average approval time"
          icon={<Clock className="h-4 w-4" />}
          trend={{ value: "-0.3 days", isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeoff Trends</CardTitle>
            <CardDescription>
              Timeoff requests over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>Distribution of request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Approved</span>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">24%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="text-sm font-medium">8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest timeoff requests and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">
                  John Doe requested timeoff
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Pending
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">
                  Jane Smith's request was approved
                </p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Approved
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Bob Johnson requested timeoff
                </p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Approved
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
