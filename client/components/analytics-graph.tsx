"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type EventData = {
  timestamp: number;
  event: "Backup" | "Manual Backup" | "Restore";
  id: string;
};

const eventColors = {
  Backup: "#8884d8",
  "Manual Backup": "#82ca9d",
  Restore: "#ffc658",
};

export function AnalyticsGraph() {
  const [data, setData] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/backup-analytics");
        if (response.ok) {
          const result = await response.json();
          setData(
            result.filter(
              (item: EventData) =>
                item.timestamp && !isNaN(item.timestamp) && item.event
            )
          );
        } else {
          console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const eventTypes = ["Restore", "Manual Backup", "Backup"];

  if (data.length === 0) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Backup Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Backup Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 60,
            }}
          >
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["auto", "auto"]}
              tickFormatter={(unixTime) =>
                new Date(unixTime).toLocaleDateString()
              }
              name="Time"
            />
            <YAxis
              dataKey="event"
              type="category"
              allowDuplicatedCategory={false}
              name="Event"
            />
            <ZAxis dataKey="id" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name, props) => {
                if (name === "Event") return props.payload.event;
                if (name === "Time")
                  return new Date(value as number).toLocaleString();
                return value;
              }}
            />
            {eventTypes.map((event) => (
              <Scatter
                key={event}
                name={event}
                data={data.filter((item) => item.event === event)}
                fill={eventColors[event as keyof typeof eventColors]}
                shape={(props:any) => {
                  const { cx, cy } = props;
                  return (
                    <circle
                      cx={isNaN(cx) ? 0 : cx}
                      cy={isNaN(cy) ? 0 : cy}
                      r={4}
                      fill={props.fill}
                    />
                  );
                }}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
