"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ManualBackupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const triggerManualBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/manual-backup`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to trigger manual backup");
      }

      toast({
        title: "Backup Initiated",
        description: "Manual backup process has been started.",
      });
    } catch (error) {
      console.error("Error triggering manual backup:", error);
      toast({
        title: "Backup Failed",
        description: "Failed to initiate manual backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Backup</CardTitle>
        <CardDescription>
          Trigger a manual backup of your database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={triggerManualBackup}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Backing up...
            </>
          ) : (
            "Start Manual Backup"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
