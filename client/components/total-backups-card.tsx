"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalBackupsCard() {
  const [totalBackups, setTotalBackups] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalBackups = async () => {
      try {
        const response = await fetch("/api/backups/count");
        if (!response.ok) {
          throw new Error("Failed to fetch total backups");
        }
        const data = await response.json();
        setTotalBackups(data.count);
      } catch (err) {
        setError("Failed to load total backups");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalBackups();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Backups</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <div className="text-2xl font-bold">{totalBackups}</div>
        )}
      </CardContent>
    </Card>
  );
}
