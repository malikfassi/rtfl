"use client";

import React, { createContext, useContext, useState } from 'react';
import type { ErrorContextType, ErrorProviderProps } from '@/app/types';

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setIsVisible(true);
  };

  const hideError = () => {
    setIsVisible(false);
    setErrorMessage(null);
  };

  return (
    <ErrorContext.Provider value={{
      showError,
      hideError,
      errorMessage,
      isVisible
    }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
} 