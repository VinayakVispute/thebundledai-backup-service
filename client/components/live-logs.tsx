"use client";
import { useEffect, useRef, useState } from "react";
import { LoggingArea } from "./loggingArea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import io, { type Socket } from "socket.io-client";

export function LiveLogs({ className }: { className?: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Create the socket connection once on mount
    const newSocket = io("http://localhost:4000");
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
