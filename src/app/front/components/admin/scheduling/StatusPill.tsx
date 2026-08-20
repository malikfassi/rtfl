"use client";

import React from "react";
import { cn } from "@/app/front/lib/utils";

export type DayStatus = "scheduled" | "empty" | "needs lyrics";

// The three status colours are already in the token set - scheduled reuses the
// hit green, empty the duplicate amber, needs-lyrics the error coral - so this
// carries no hex of its own.
const styles: Record<DayStatus, string> = {
  scheduled: "text-rtfl-hit bg-rtfl-hit/10",
  empty: "text-rtfl-duplicate bg-rtfl-duplicate/10",
  "needs lyrics": "text-rtfl-error bg-rtfl-error/10",
};

export function StatusPill({ status, className }: { status: DayStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[7px] py-[2px] font-sans text-[10px] tracking-[0.04em] whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
