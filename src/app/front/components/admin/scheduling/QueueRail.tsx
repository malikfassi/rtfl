"use client";

import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/app/front/lib/utils";
import { parseMonthString, getTodayDate } from "@/app/front/lib/utils/date-formatting";
import { StatusPill } from "./StatusPill";
import type { QueueDay } from "./day-model";

export type SelectMode = "replace" | "toggle" | "range";

interface QueueRailProps {
  month: string;
  days: QueueDay[];
  selected: string[];
  isLoading: boolean;
  /** The month failed to load, so `days` is a month of placeholders. */
  isError: boolean;
  onSelect: (date: string, mode: SelectMode) => void;
  onMonthChange: (month: string) => void;
  onSelectAllEmpty: () => void;
}

export function QueueRail({
  month,
  days,
  selected,
  isLoading,
  isError,
  onSelect,
  onMonthChange,
  onSelectAllEmpty,
}: QueueRailProps) {
  const today = getTodayDate();
  const listRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  // The spec's queue is "the next 5-7 days". A whole month is scrollable
  // instead, so an arbitrary date stays reachable - but it should still open
  // on the part of the month that needs attention.
  useEffect(() => {
    if (isLoading) return;
    todayRef.current?.scrollIntoView({ block: "center" });
  }, [month, isLoading]);

  const monthDate = parseMonthString(month);
  const noData = isLoading || isError;
  const emptyCount = days.filter(d => d.status === "empty" && d.date >= today).length;

  const shiftMonth = (delta: number) => {
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + delta);
    onMonthChange(format(next, "yyyy-MM"));
  };

  return (
    <div className="flex min-h-0 flex-col border-r border-rtfl-line-soft bg-rtfl-surface">
      <div className="flex flex-col gap-[10px] border-b border-rtfl-line-soft p-[18px_20px]">
        <div className="flex items-baseline gap-[14px]">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="text-[13px] text-rtfl-ink-2 hover:text-rtfl-ink"
          >
            ◀
          </button>
          <h2 className="m-0 font-mono text-[15px] font-bold tracking-[0.01em]">
            {format(monthDate, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="text-[13px] text-rtfl-ink-2 hover:text-rtfl-ink"
          >
            ▶
          </button>
        </div>
        {/* Without a loaded month every day counts as empty, so naming a number
            here would be a guess dressed up as a fact. */}
        <button
          type="button"
          onClick={onSelectAllEmpty}
          disabled={noData || emptyCount === 0}
          className={cn(
            "self-start font-sans text-[11px] text-rtfl-ink-2 hover:text-rtfl-ink",
            (noData || emptyCount === 0) &&
              "cursor-not-allowed text-rtfl-ink-3 hover:text-rtfl-ink-3",
          )}
        >
          {noData
            ? "select the unscheduled days ahead"
            : `select the ${emptyCount} unscheduled ${emptyCount === 1 ? "day" : "days"} ahead`}
        </button>
      </div>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-[6px] overflow-y-auto p-[14px]">
        {isLoading ? (
          [0, 1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              style={{ animationDelay: `${i * 60}ms` }}
              className="block h-[68px] animate-rtfl-breathe rounded-[9px] bg-rtfl-raised"
            />
          ))
        ) : isError ? (
          // Listing the days here would render every one as "nothing
          // scheduled", which reads as a confirmed empty month rather than as a
          // month we failed to read.
          <p className="m-0 p-[12px_13px] font-sans text-[12px] text-rtfl-ink-3">
            Could not load {month}.
          </p>
        ) : (
          days.map(day => {
              const isSelected = selected.includes(day.date);
              const isToday = day.date === today;
              const isPast = day.date < today;

              return (
                <button
                  key={day.date}
                  ref={isToday ? todayRef : undefined}
                  type="button"
                  onClick={e =>
                    onSelect(day.date, e.shiftKey ? "range" : e.metaKey || e.ctrlKey ? "toggle" : "replace")
                  }
                  className={cn(
                    "flex flex-col gap-[6px] rounded-[9px] border p-[12px_13px] text-left transition-colors duration-150",
                    isSelected
                      ? "border-rtfl-accent-line bg-rtfl-accent-bg"
                      : "border-rtfl-line-soft bg-rtfl-bg hover:border-rtfl-ink-3",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono text-[12.5px] tabular-nums",
                        isToday ? "text-rtfl-accent" : isPast ? "text-rtfl-ink-3" : "text-rtfl-ink",
                      )}
                    >
                      {day.date}
                    </span>
                    <StatusPill status={day.status} />
                  </span>
                  {day.game ? (
                    <>
                      <span className="truncate font-sans text-[13.5px] text-rtfl-ink">{day.title}</span>
                      <span className="truncate font-sans text-[11.5px] text-rtfl-ink-3">
                        {day.artist}
                        {day.words !== null && ` · ${day.words} words`}
                      </span>
                    </>
                  ) : (
                    <span className="font-sans text-[11.5px] text-rtfl-ink-3">nothing scheduled</span>
                  )}
                </button>
              );
          })
        )}
      </div>
    </div>
  );
}
