"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // We use useState to ensure the QueryClient is only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // "staleTime" = How long data is considered "fresh" before we fetch again.
            // We set it to 1 minute. Navigation between pages within 1 minute will be INSTANT.
            staleTime: 60 * 1000,

            // If the user clicks away and comes back, don't refetch immediately
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
