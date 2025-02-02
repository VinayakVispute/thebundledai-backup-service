"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CloudIcon, HardDriveIcon } from "lucide-react";
import Link from "next/link";

type Backup = {
  id: string;
  createdAt: string;
  dbName: string;
  environment: "PRODUCTION" | "DEVELOPMENT";
  triggeredBy: "CRON" | "MANUAL";
  driveFolderId: string | null;
  driveFileId: string | null;
  localPath: string | null;
};

export function BackupList({ className }: { className?: string }) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const { toast } = useToast();

  const fetchBackups = async () => {
    const response = await fetch("/api/backups");
    if (response.ok) {
      const data = await response.json();
      setBackups(data);
    }
  };

  const handleRestore = async (backupId: string) => {
    const response = await fetch("/api/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ backupId }),
    });

    if (response.ok) {
      toast({
        title: "Restore initiated",
        description: "The backup restore process has been started.",
      });
    } else {
      toast({
        title: "Restore failed",
        description: "There was an error initiating the restore process.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]); // Added fetchBackups to the dependency array

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Backup List</CardTitle>
        <CardDescription>Manage your database backups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 bg-secondary rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{backup.dbName}</p>
                  <Badge
                    variant={
                      backup.environment === "PRODUCTION"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {backup.environment}
                  </Badge>
                  <Badge variant="outline">{backup.triggeredBy}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(backup.createdAt).toLocaleString()}
                </p>
                {backup.localPath ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <HardDriveIcon className="w-4 h-4 mr-1" />
                    Local
                  </div>
                ) : (
                  <Link
                    href={`https://drive.google.com/drive/folders/${backup.driveFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-500 hover:underline"
                  >
                    <CloudIcon className="w-4 h-4 mr-1" />
                    View in Google Drive
                  </Link>
                )}
              </div>
              <Button onClick={() => handleRestore(backup.id)}>Restore</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
