"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { queryClient } from './lib/query-client';

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 