"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RestoreFormProps {
  backupId: string;
  dbName: string;
  onClose: () => void;
}

export function RestoreForm({ backupId, dbName, onClose }: RestoreFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [collections, setCollections] = useState("");
  const { toast } = useToast();

  const handleRestore = async () => {
    const response = await fetch("/api/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        backupId,
        dbName,
        collections: collections
          ? collections.split(",").map((c) => c.trim())
          : undefined,
      }),
    });

    if (response.ok) {
      toast({
        title: "Restore initiated",
        description: "The backup restore process has been started.",
      });
      setIsOpen(false);
      onClose();
    } else {
      toast({
        title: "Restore failed",
        description: "There was an error initiating the restore process.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Backup</DialogTitle>
          <DialogDescription>
            You are about to restore the backup for database: {dbName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collections" className="text-right">
              Collections
            </Label>
            <Input
              id="collections"
              placeholder="Enter comma-separated collection names (optional)"
              className="col-span-3"
              value={collections}
              onChange={(e) => setCollections(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleRestore}>Restore</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
