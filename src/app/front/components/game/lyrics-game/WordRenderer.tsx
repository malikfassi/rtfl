import React from "react";
import { cn } from "@/app/front/lib/utils";
import type { WordRendererProps } from "@/app/types";

export function WordRenderer({
  word,
  isFound,
  shouldShow,
  isNewlyFound,
  isHovered,
  isSelected,
  color
}: WordRendererProps) {
  return (
    <span
      className={cn(
        "relative font-mono text-sm align-baseline",
        shouldShow
          ? isFound
            ? cn(
                "text-primary-dark",
                isNewlyFound && "animate-word-reveal",
                ((isHovered || isSelected))
                  ? cn(color && `${color.bg} ${color.text}`, (isHovered || isSelected) && "transition-colors duration-300 scale-105")
                  : undefined
              )
            : "text-primary-dark/90 animate-word-reveal"
          : cn(
              "text-primary-dark/0",
              "relative"
            ),
        "inline-block min-w-[1ch] text-center transition-none"
      )}
      style={{ fontWeight: 'inherit', fontSize: 'inherit', padding: 0 }}
    >
      {shouldShow ? word : (
        <>
          <span className="opacity-0 select-none">{word}</span>
          <span 
            className={cn(
              "absolute inset-0 text-primary-muted/30 flex items-center justify-center select-none",
              "transition-none"
            )}
            style={{ fontWeight: 'inherit', fontSize: 'inherit', padding: 0 }}
          >
            {'_'.repeat(word.length)}
          </span>
        </>
      )}
    </span>
  );
} 