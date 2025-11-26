"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data được coi là fresh trong 5 phút
            gcTime: 5 * 60 * 1000, // 5 minutes - cache được giữ trong 5 phút
            refetchOnWindowFocus: false, // Không refetch khi focus window
            retry: 1, // Chỉ retry 1 lần khi lỗi
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
