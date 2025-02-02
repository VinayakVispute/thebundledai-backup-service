import { NextResponse } from "next/server";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const sendLog = (message: string) => {
        const log = {
          timestamp: new Date().toISOString(),
          message,
        };
        controller.enqueue(`data: ${JSON.stringify(log)}\n\n`);
      };

      // Simulate log entries (replace with actual log source)
      const interval = setInterval(() => {
        sendLog(`Log entry at ${new Date().toLocaleTimeString()}`);
      }, 5000);

      // Clean up the interval when the client disconnects
      return () => clearInterval(interval);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
