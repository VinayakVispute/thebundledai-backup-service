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
import { Badge } from "@/components/ui/badge";
import { CloudIcon, HardDriveIcon } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { RestoreForm } from "./restore-form";

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
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  const fetchBackups = async () => {
    const response = await fetch("/api/backups");
    if (response.ok) {
      const data = await response.json();
      setBackups(data);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []); //This line was already correct.  The comment was added for clarity.

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Backup List</CardTitle>
        <CardDescription>Manage your database backups</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-15rem)] w-full ">
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
                <Button onClick={() => setSelectedBackup(backup)}>
                  Restore
                </Button>
              </div>
            ))}

            {backups.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    End of backup list
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {selectedBackup && (
        <RestoreForm
          backupId={selectedBackup.id}
          dbName={selectedBackup.dbName}
          onClose={() => setSelectedBackup(null)}
        />
      )}
    </Card>
  );
}
