"use client";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Socket } from "socket.io-client";

type Log = {
  id: string;
  streamName: "backup" | "restore";
  message: string;
  requestId: string;
  timestamp: string;
  level: "info" | "warning" | "error";
};

const getLogColor = (level: Log["level"]) => {
  switch (level) {
    case "info":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

// Helper function to group logs by requestId
const groupLogsByRequestId = (logs: Log[]) => {
  const groups: { [key: string]: Log[] } = {};
  logs.forEach((log) => {
    if (!groups[log.requestId]) {
      groups[log.requestId] = [];
    }
    groups[log.requestId].push(log);
  });
  return groups;
};

const LogGroup = ({ logs }: { logs: Log[] }) => {
  const requestId = logs[0].requestId;
  const borderColor = `border-l-4 border-${
    logs.some((log) => log.level === "error")
      ? "red"
      : logs.some((log) => log.level === "warning")
      ? "yellow"
      : "green"
  }-500`;

  return (
    <div className={`mb-6 pl-4 ${borderColor}`}>
      <div className="text-xs text-gray-500 mb-2">Request ID: {requestId}</div>
      {logs.map((log, index) => (
        <div
          key={`${log.id}-${index}`}
          className={`${getLogColor(log.level)} mb-2 leading-relaxed`}
        >
          <span className="text-gray-500 dark:text-gray-400 mr-2">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          {log.message}
        </div>
      ))}
      <div className="text-gray-600 dark:text-gray-400 text-center mt-2 text-sm">
        ────── End of Request {requestId && requestId.slice(0, 8)} ──────
      </div>
    </div>
  );
};

export function LoggingArea({ socket }: { socket: Socket | null }) {
  const [activeStream, setActiveStream] = useState<string>("backup");
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // Socket connection handling
  if (!socket) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-sm text-red-500">
        No socket connection. Waiting for logs...
      </div>
    );
  }

  useEffect(() => {
    if (!socket) return;

    const onLogs = (log: Log) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    };

    socket.on("logs", onLogs);

    return () => {
      socket.off("logs", onLogs);
    };
  }, [socket]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [scrollAreaRef]); //Corrected dependency

  // Filter logs by active stream and group by requestId
  const filteredLogs = logs.filter((log) => log.streamName === activeStream);
  const groupedLogs = groupLogsByRequestId(filteredLogs);

  return (
    <div className="p-0 min-h-full bg-black">
      <div className="flex gap-2 p-4 border-b border-gray-800">
        <button
          onClick={() => setActiveStream("backup")}
          className={`px-3 py-1 rounded transition-colors ${
            activeStream === "backup"
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Backup Process
        </button>
        <button
          onClick={() => setActiveStream("restore")}
          className={`px-3 py-1 rounded transition-colors ${
            activeStream === "restore"
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Restore Process
        </button>
      </div>
      <ScrollArea className="h-[400px]" ref={scrollAreaRef}>
        <div className="p-4">
          {groupedLogs &&
            Object.values(groupedLogs).map((logGroup, index) => (
              <LogGroup key={index} logs={logGroup} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
