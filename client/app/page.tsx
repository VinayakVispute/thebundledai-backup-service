import type { Metadata } from "next";
import { BackupList } from "@/components/backup-list";
import { LiveLogs } from "@/components/live-logs";
import { CronJobTimer } from "@/components/cron-job-timer";
import { AnalyticsGraph } from "@/components/analytics-graph";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Backup management dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Backup Dashboard
          </h2>
          <ThemeToggle />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CronJobTimer />
          <Card>
            <CardHeader>
              <CardTitle>Total Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Latest Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <BackupList className="md:col-span-1" />
          <LiveLogs className="md:col-span-1" />
        </div>
        <AnalyticsGraph />
      </div>
    </div>
  );
}
