"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

export function CronJobTimer() {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(24, 0, 0, 0); // Set to next midnight

      const diff = nextRun.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Next Backup In</CardTitle>
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{timeRemaining}</div>
      </CardContent>
    </Card>
  );
}
