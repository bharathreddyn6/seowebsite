import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Resolve a full URL: if url is absolute, use it; otherwise prefix with VITE_API_BASE or localhost:5000
  const base = typeof window !== "undefined" ? (import.meta.env.VITE_API_BASE as string) || "http://localhost:5000" : process.env.API_BASE || "http://localhost:5000";
  const fullUrl = url.startsWith("http") ? url : `${base.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const base = typeof window !== "undefined" ? (import.meta.env.VITE_API_BASE as string) || "http://localhost:5000" : process.env.API_BASE || "http://localhost:5000";
    const path = queryKey.join("/");
    const fullUrl = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
