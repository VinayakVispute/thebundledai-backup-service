import { useAuth } from "@clerk/nextjs";
import axios, { AxiosInstance } from "axios";
import { useMemo } from "react";

export function useApiClient(): AxiosInstance {
  const { getToken } = useAuth();

  const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

  if (!SERVER_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SERVER_BASE_URL");
  }

  // useMemo ensures we don't recreate the instance on every render
  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: SERVER_BASE_URL,
    });

    // Attach an interceptor that fetches the token each time
    instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers["Access-Control-Allow-Origin"] = window.location.origin;
      config.headers["Access-Control-Allow-Credentials"] = "true";
      return config;
    });

    return instance;
  }, [getToken]);

  return client;
}
