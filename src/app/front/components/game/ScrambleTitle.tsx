"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/app/front/lib/utils";
import Link from "next/link";
import { ScrambleTitleProps } from "./lyrics-game/types";

const specialChars = "!@#$%^&*()_+FUCKING";
const baseWord = "FUCKING";
const colors = [
  "text-accent-error",      // Vibrant pink
  "text-accent-warning",    // Bright yellow
  "text-accent-success",    // Mint green
  "text-primary-light",     // Light purple
  "text-primary-dark",      // Dark purple
];

// === ScrambleTitle Animation Constants ===
// Duration of the entire scramble animation phase (ms)
const SCRAMBLE_DURATION = 2000; // ms
// Duration of the entire resting phase (ms)
const REST_DURATION = 2000; // ms
// Time between each scramble frame (higher = slower scramble, ms)
const SCRAMBLE_INTERVAL = 180; // ms per scramble frame
// Time between each wobble update in all phases (higher = slower wobble, ms)
const WOBBLE_INTERVAL = 120; // ms per wobble frame (constant for all phases)
// Maximum horizontal wobble range (px)
const WOBBLE_X_RANGE = 2; // px, horizontal wobble range
// Maximum vertical wobble range (px)
const WOBBLE_Y_RANGE = 4; // px, vertical wobble range
// Maximum rotation wobble range (deg)
const WOBBLE_ROTATE_RANGE = 6; // deg, rotation range

// Helper to get a random color
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}
// Helper to get a random wobble transform
function getRandomWobble() {
  return `translate(${Math.random() * WOBBLE_X_RANGE - WOBBLE_X_RANGE / 2}px, ${Math.random() * WOBBLE_Y_RANGE}px) rotate(${Math.random() * WOBBLE_ROTATE_RANGE - WOBBLE_ROTATE_RANGE / 2}deg)`;
}

// Helper to get a random char
function getRandomChar() {
  return specialChars[Math.floor(Math.random() * specialChars.length)];
}

type Phase = 'scrambling' | 'resting' | 'hover';

interface Letter {
  char: string;
  transform: string;
  isScrambling: boolean;
  color: string;
}

export function ScrambleTitle({ date }: ScrambleTitleProps) {
  const [phase, setPhase] = useState<Phase>('scrambling');
  const [restingLetters, setRestingLetters] = useState<Letter[]>([]);
  const [hoverColors, setHoverColors] = useState<string[]>(baseWord.split('').map(getRandomColor));
  const [letters, setLetters] = useState<Letter[]>(
    baseWord.split('').map(char => ({
      char,
      transform: getRandomWobble(),
      isScrambling: false,
      color: getRandomColor(),
    }))
  );
  // Add a ref to always have the latest letters
  const lettersRef = useRef<Letter[]>(letters);
  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);

  // Scrambling effect
  useEffect(() => {
    if (phase !== 'scrambling') return;
    let frame = 0;
    const scrambleFrames = Math.floor(SCRAMBLE_DURATION / SCRAMBLE_INTERVAL);
    const scrambleInterval = setInterval(() => {
      setLetters(prev => prev.map(() => ({
        char: getRandomChar(),
        transform: getRandomWobble(),
        isScrambling: true,
        color: getRandomColor(),
      })));
      frame++;
      if (frame >= scrambleFrames) {
        clearInterval(scrambleInterval);
        // Use the latest scrambled letters for resting
        setRestingLetters(lettersRef.current.map(l => ({ ...l })));
        setPhase('resting');
      }
    }, SCRAMBLE_INTERVAL);
    return () => clearInterval(scrambleInterval);
  }, [phase]);

  // Resting phase: keep last scrambled letters, but wobble
  useEffect(() => {
    if (phase !== 'resting') return;
    // Wobble only, don't change char/color
    const wobbleInterval = setInterval(() => {
      setRestingLetters(prev => prev.map(l => ({
        ...l,
        transform: getRandomWobble(),
      })));
    }, WOBBLE_INTERVAL);
    // After rest duration, go back to scrambling
    const timeout = setTimeout(() => setPhase('scrambling'), REST_DURATION);
    return () => {
      clearInterval(wobbleInterval);
      clearTimeout(timeout);
    };
  }, [phase]);

  // On hover, generate new random colors for real title
  const handleMouseEnter = () => {
    setHoverColors(baseWord.split('').map(getRandomColor));
    setPhase('hover');
  };
  const handleMouseLeave = () => {
    setPhase('resting');
  };

  // Always wobble in hover (but do not change color)
  useEffect(() => {
    if (phase !== 'hover') return;
    const wobbleInterval = setInterval(() => {
      // Only update the transform (wobble), not the color
      setHoverColors(prev => [...prev]); // force re-render
    }, WOBBLE_INTERVAL);
    return () => clearInterval(wobbleInterval);
  }, [phase]);

  // Render letters based on phase
  let displayLetters: Letter[];
  if (phase === 'scrambling') {
    displayLetters = letters.map(l => ({
      ...l,
      transform: getRandomWobble(),
    }));
  } else if (phase === 'resting') {
    displayLetters = (restingLetters.length ? restingLetters : letters).map(l => ({
      ...l,
      transform: getRandomWobble(),
    }));
  } else {
    // hover: show real title, each letter random color (fixed), always wobble
    displayLetters = baseWord.split('').map((char, idx) => ({
      char,
      transform: getRandomWobble(),
      isScrambling: false,
      color: hoverColors[idx] || getRandomColor(),
    }));
  }

  return (
    <h1 className="text-2xl font-bold uppercase tracking-wider">
      READ THE{' '}
      <span
        className="inline-flex overflow-hidden group font-mono cursor-pointer"
        style={{ width: '7ch' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {displayLetters.map((letter, index) => (
          <span
            key={index}
            className={cn(
              "inline-block transition-all duration-100 relative text-center",
              letter.color
            )}
            style={{
              transform: letter.transform,
              width: '1ch',
              minWidth: '1ch',
              cursor: phase === 'hover' ? 'pointer' : undefined,
              transition: 'transform 0.15s cubic-bezier(0.4,0.2,0.2,1), color 0.15s, opacity 0.15s, font-size 0.15s',
              opacity: letter.isScrambling ? 0.7 : 1,
              fontSize: '1em',
            }}
            data-real-char={baseWord[index]}
          >
            {letter.char}
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