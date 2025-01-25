"use client";

import React, { useState, useEffect } from "react";

const specialChars = "!@#$%^&*()_+";
const baseWord = "FUCKING";

export function ScrambleTitle() {
  const [scrambledLetters, setScrambledLetters] = useState(baseWord.split('').map(letter => ({
    char: letter,
    transform: '',
  })));

  useEffect(() => {
    const interval = setInterval(() => {
      const shouldScramble = Math.random() > 0.5;
      if (shouldScramble) {
        setScrambledLetters(baseWord.split('').map(letter => ({
          char: Math.random() > 0.5 ? specialChars[Math.floor(Math.random() * specialChars.length)] : letter,
          transform: `
            translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px) 
            rotate(${Math.random() * 10 - 5}deg)
          `,
        })));
      } else {
        setScrambledLetters(baseWord.split('').map(letter => ({
          char: letter,
          transform: 'translate(0, 0) rotate(0deg)',
        })));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-2xl font-bold uppercase tracking-wider">
      READ THE{' '}
      <span className="inline-flex">
        {scrambledLetters.map((letter, index) => (
          <span
            key={index}
            className="inline-block transition-all duration-300"
            style={{ transform: letter.transform }}
          >
            {letter.char}
          </span>
        ))}
      </span>
      {' '}LYRICS
    </h1>
  );
} 