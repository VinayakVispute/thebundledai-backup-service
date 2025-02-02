"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Log = {
  timestamp: string;
  message: string;
};

export function LiveLogs({ className }: { className?: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/logs");
    eventSource.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs((prevLogs) => [...prevLogs, log].slice(-100)); // Keep only the last 100 logs
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scrollRef]); //Corrected dependency

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Live Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded border border-gray-200 dark:border-gray-700">
          <div ref={scrollRef} className="p-4 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="text-green-500 dark:text-green-400">
                <span className="text-gray-500 dark:text-gray-400">
                  {log.timestamp}
                </span>{" "}
                {log.message}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
