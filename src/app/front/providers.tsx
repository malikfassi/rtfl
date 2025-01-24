'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { queryClient } from '@/app/front/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 