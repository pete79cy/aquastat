import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, err: unknown) => {
        // Don't retry on auth errors
        if (typeof err === "object" && err && "status" in err && (err as { status: number }).status === 401) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
