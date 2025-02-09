"use client";
import { useEffect, useState } from "react";
import { LoggingArea } from "./loggingArea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import io, { type Socket } from "socket.io-client";

export function LiveLogs({ className }: { className?: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

  if (!SERVER_URL) {
    throw new Error("NEXT_PUBLIC_SERVER_BASE_URL is not defined");
  }

  useEffect(() => {
    // Create the socket connection once on mount
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="border-b border-border">
        <CardTitle>Live Logs</CardTitle>
      </CardHeader>
      <CardContent className="h-full p-0">
        {/* Only render LoggingArea if socket is defined */}
        {socket && <LoggingArea socket={socket} />}
      </CardContent>
    </Card>
  );
}
