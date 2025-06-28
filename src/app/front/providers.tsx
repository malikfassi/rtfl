"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { queryClient } from './lib/query-client';
import { ErrorProvider } from './contexts/ErrorContext';

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        {children}
      </ErrorProvider>
    </QueryClientProvider>
  );
} 