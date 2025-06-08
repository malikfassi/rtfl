"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/app/front/lib/utils";
import Link from "next/link";

const specialChars = "!@#$%^&*()_+FUCKING";
const baseWord = "FUCKING";
const colors = [
  "text-accent-error",      // Vibrant pink
  "text-accent-warning",    // Bright yellow
  "text-accent-success",    // Mint green
  "text-primary-light",     // Light purple
  "text-primary-dark",      // Dark purple
];

interface Letter {
  char: string;
  transform: string;
  isScrambling: boolean;
  color: string;
}

interface ScrambleTitleProps {
  date: string;
}

export function ScrambleTitle({ date }: ScrambleTitleProps) {
  const [letters, setLetters] = useState<Letter[]>(
    baseWord.split('').map(char => ({
      char,
      transform: '',
      isScrambling: false,
      color: "text-primary-dark",
    }))
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const scrambleLetter = useCallback((index: number) => {
    let frames = 0;
    const maxFrames = 20;
    
    const interval = setInterval(() => {
      setLetters(prev => prev.map((letter, i) => {
        if (i !== index) return letter;
        
        const newChar = specialChars[Math.floor(Math.random() * specialChars.length)];
        const newTransform = `
          translate(${Math.random() * 2 - 1}px, ${Math.random() * 4}px) 
          rotate(${Math.random() * 6 - 3}deg)
        `;
        
        return {
          ...letter,
          char: newChar,
          transform: newTransform,
          isScrambling: true,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      }));

      frames++;
      if (frames >= maxFrames) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startScrambleAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Create random delays for each letter
    const delays = baseWord.split('').map(() => Math.random() * 300);
    const cleanupFns: (() => void)[] = [];

    // Start scrambling each letter at its random delay
    baseWord.split('').forEach((_, index) => {
      const timeout = setTimeout(() => {
        const cleanup = scrambleLetter(index);
        cleanupFns.push(cleanup);
        
        // If this is the last letter to finish
        const thisLetterTotalTime = delays[index] + (20 * 100);
        const maxTotalTime = Math.max(...delays) + (20 * 100) + 100;
        
        if (thisLetterTotalTime >= maxTotalTime) {
          setTimeout(() => {
            setIsAnimating(false);
            cleanupFns.forEach(fn => fn());
          }, 100);
        }
      }, delays[index]);
      
      cleanupFns.push(() => clearTimeout(timeout));
    });

    return () => cleanupFns.forEach(fn => fn());
  }, [scrambleLetter]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isScrambling = true;
    
    const animate = () => {
      if (isScrambling) {
        const cleanup = startScrambleAnimation();
        timeoutId = setTimeout(() => {
          if (cleanup) cleanup();
          isScrambling = false;
          animate();
        }, 2000);
      } else {
        timeoutId = setTimeout(() => {
          isScrambling = true;
          animate();
        }, 2000);
      }
    };

    animate();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [startScrambleAnimation]);

  return (
    <h1 className="text-2xl font-bold uppercase tracking-wider">
      READ THE{' '}
      <span className="inline-flex overflow-hidden group font-mono" style={{ width: '7ch' }}>
        {letters.map((letter, index) => (
          <span
            key={index}
            className={cn(
              "inline-block transition-all duration-100 relative text-center",
              letter.isScrambling ? letter.color : "text-primary-dark",
              !letter.isScrambling && "hover:-translate-y-0.5"
            )}
            style={{ 
              transform: letter.transform,
              width: '1ch',
              minWidth: '1ch'
            }}
            data-real-char={baseWord[index]}
          >
            <span className="group-hover:opacity-0 transition-opacity duration-300 block">
              {letter.char}
            </span>
            <span className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center",
              colors[index % colors.length]  // Each letter gets its own color
            )}>
              {baseWord[index]}
            </span>
          </span>
        ))}
      </span>
      {' '}LYRICS{' '}
      <Link href="/archive" className="group inline-flex items-baseline">
        <span className="text-xs font-normal text-foreground/70 group-hover:hidden transition-all duration-300">
          {date}
        </span>
        <span className="hidden group-hover:inline text-xs font-normal text-accent-success whitespace-nowrap transition-all duration-300">
          Go to archive →
        </span>
      </Link>
    </h1>
  );
} 