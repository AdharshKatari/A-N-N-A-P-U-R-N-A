import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  // React Query v4 logs every rejected query through console.error in development.
  // React Native turns that into a full-screen LogBox even when the screen already
  // renders its own recoverable error state. Keep the diagnostic without blocking UI.
  logger: {
    log: console.log,
    warn: console.warn,
    error: (...args: unknown[]) => console.info('[Query error]', ...args),
  },
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
