import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes caching by default - reduce network calls significantly
      staleTime: 1000 * 60 * 5,
      // Keep unused data in cache for 10 more minutes (allows back navigation)
      gcTime: 1000 * 60 * 10,
      retry: 1,
      // Don't refetch on window focus for POS (reduces interruptions)
      refetchOnWindowFocus: false,
      // Prefetch indicator for better UX
      placeholderData: (previousData) => previousData,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
