import { SpotifyApiError } from '../errors/clients/spotify';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface RetryOptions {
  retryCount?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, waitTime: number, error: unknown) => void;
}

/**
 * Utility to retry operations with exponential backoff and rate limit handling
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error encountered if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retryCount = 3,
    initialDelay = 5000, // Start with 5s delay
    maxDelay = 30000,    // Max delay of 30s
    onRetry = (attempt, waitTime, error) => {
      const err = error as { status?: number; message?: string };
      if (err.status === 429) {
        console.log(`Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retryCount}...`);
      } else {
        console.log(`Request failed. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retryCount}...`);
      }
    }
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const err = error as { status?: number; headers?: { get?: (key: string) => string } };
      
      // Only retry on rate limit errors
      if (err.status === 429 && attempt < retryCount - 1) {
        const retryAfter = err.headers?.get?.('Retry-After');
        // Use Retry-After header or exponential backoff with jitter
        const baseDelay = retryAfter ? 
          parseInt(retryAfter, 10) * 1000 : 
          Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        // Add jitter to avoid thundering herd
        const jitter = Math.random() * 1000;
        const waitTime = baseDelay + jitter;
        
        onRetry(attempt, waitTime, error);
        await delay(waitTime);
        continue;
      }
      
      // Throw immediately for all other errors
      throw error;
    }
  }
  
  throw new SpotifyApiError(lastError as Error);
} 