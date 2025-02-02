"use client";

import type React from "react";

export const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`p-6 rounded-lg border border-gray-200 shadow-sm dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">{children}</div>
);

export const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-medium">{children}</h3>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const CardDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>;
