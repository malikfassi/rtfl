import { useState } from 'react';
import { isFutureDate, isValidDate } from '@/app/front/lib/utils/date-formatting';

interface RickrollModeProps {
  date: string;
  rickrollMode?: boolean;
  lyrics?: string[];
  maskedLyrics?: string[];
}

export function useRickrollMode({
  date,
  rickrollMode = false,
  lyrics: rickrollLyrics,
  maskedLyrics: rickrollMaskedLyrics
}: RickrollModeProps) {
  const [showRickrollNotice, setShowRickrollNotice] = useState(false);
  
  const isValidDateFormat = isValidDate(date);
  const isFuture = isValidDateFormat && isFutureDate(date);
  
  const isRickroll = rickrollMode && isValidDateFormat && isFuture;
  
  return {
    isRickroll,
    isFutureDate: isFuture,
    isValidDate: isValidDateFormat,
    showRickrollNotice,
    setShowRickrollNotice,
    rickrollLyrics,
    rickrollMaskedLyrics
  };
} 