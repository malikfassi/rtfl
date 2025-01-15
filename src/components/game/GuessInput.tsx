'use client';

import React, { useState } from 'react';
import { z } from 'zod';

interface GuessInputProps {
  onSubmit: (guess: string) => Promise<void>;
  disabled?: boolean;
}

const guessSchema = z.string().min(1).max(50);

export function GuessInput({ onSubmit, disabled = false }: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate input
      guessSchema.parse(guess);

      // Submit guess
      setIsSubmitting(true);
      await onSubmit(guess);
      setGuess(''); // Clear input on success
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError('Please enter a valid guess (1-50 characters)');
      } else {
        setError('Failed to submit guess. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess..."
            disabled={disabled || isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={disabled || isSubmitting || !guess}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Guess'}
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </div>
    </form>
  );
} 