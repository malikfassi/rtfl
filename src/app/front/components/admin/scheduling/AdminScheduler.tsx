"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Track } from "@spotify/web-api-ts-sdk";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { useAdminGames, useAdminGameMutations } from "@/app/front/hooks/useAdmin";
import { getCurrentMonth } from "@/app/front/lib/routes";
import { getTodayDate, parseMonthString } from "@/app/front/lib/utils/date-formatting";
import { QueueRail, type SelectMode } from "./QueueRail";
import { AssignPanel } from "./AssignPanel";
import { buildQueueDay, type QueueDay } from "./day-model";

export function AdminScheduler() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthDate = parseMonthString(month);
  const today = getTodayDate();

  // isPending rather than isLoading: isLoading is `isPending && isFetching`, so
  // it drops back to false during retry backoff - and that gap is exactly when
  // the counts below would otherwise report an unloaded month as fully empty.
  const { data: games = [], isPending, isError, error: loadError } = useAdminGames(monthDate);
  const { createGame, deleteGame } = useAdminGameMutations();

  const days: QueueDay[] = useMemo(() => {
    const byDate = new Map(games.map(game => [game.date, game]));
    return eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) }).map(
      day => {
        const date = format(day, "yyyy-MM-dd");
        return buildQueueDay(date, byDate.get(date) ?? null);
      },
    );
  }, [games, monthDate]);

  // Only days that are still fillable count as a gap - a past day with no game
  // is history, not a task.
  const unscheduledAhead = useMemo(
    () => days.filter(d => d.status === "empty" && d.date >= today).map(d => d.date),
    [days, today],
  );

  const selectedDays = useMemo(
    () => days.filter(d => selected.includes(d.date)),
    [days, selected],
  );

  const handleSelect = (date: string, mode: SelectMode) => {
    setError(null);
    if (mode === "toggle") {
      setSelected(prev =>
        prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date],
      );
      setAnchor(date);
      return;
    }
    if (mode === "range" && anchor) {
      const all = days.map(d => d.date);
      const from = all.indexOf(anchor);
      const to = all.indexOf(date);
      if (from !== -1 && to !== -1) {
        const [lo, hi] = from < to ? [from, to] : [to, from];
        setSelected(all.slice(lo, hi + 1));
        return;
      }
    }
    setSelected([date]);
    setAnchor(date);
  };

  // Each write triggers a Genius scrape server-side, so these run one at a
  // time rather than as a burst of parallel requests.
  // Callers clear the banner themselves before calling in - clearing it here
  // would wipe a notice the caller had just set (see handleScheduleMany).
  const runSequentially = async (
    key: string,
    jobs: Array<() => Promise<unknown>>,
  ) => {
    setBusy(key);
    let done = 0;
    try {
      for (const job of jobs) {
        await job();
        done += 1;
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : "Something went wrong";
      // A run that stops halfway otherwise looks like it did nothing at all,
      // or like it finished - say how far it actually got.
      setError(
        jobs.length > 1 ? `${reason} - stopped after ${done} of ${jobs.length}.` : reason,
      );
    } finally {
      setBusy(null);
    }
  };

  const handleSchedule = (spotifyId: string, dates: string[]) => {
    setError(null);
    return runSequentially(
      `schedule:${spotifyId}`,
      dates.map(date => () => createGame.mutateAsync({ date, spotifyId })),
    );
  };

  const handleScheduleMany = (tracks: Track[], dates: string[]) => {
    // One distinct track per day, in playlist order. A playlist shorter than
    // the selection fills what it can rather than repeating songs - a repeated
    // song across two days would be a silent duplicate answer.
    const pairs = dates.slice(0, tracks.length).map((date, i) => ({ date, track: tracks[i] }));
    setError(
      pairs.length < dates.length
        ? `Playlist has ${tracks.length} tracks for ${dates.length} selected days - filling the first ${pairs.length}.`
        : null,
    );
    return runSequentially(
      "schedule:batch",
      pairs.map(({ date, track }) => () => createGame.mutateAsync({ date, spotifyId: track.id })),
    );
  };

  const handleRemove = (dates: string[]) => {
    setError(null);
    return runSequentially(
      `remove:${dates[0]}`,
      dates.map(date => () => deleteGame.mutateAsync(date)),
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-rtfl-bg font-mono text-rtfl-ink">
      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col overflow-hidden p-6 max-sm:p-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-rtfl-line max-sm:rounded-none max-sm:border-none">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rtfl-line-soft bg-rtfl-surface p-[18px_24px]">
            <div className="flex flex-col gap-[6px]">
              <h1 className="m-0 font-mono text-[19px] font-bold uppercase tracking-[0.1em] text-rtfl-ink">
                RTFL
              </h1>
              <div className="flex items-center gap-[14px]">
                <span className="font-sans text-[12px] text-rtfl-ink-2">scheduling</span>
                <Link
                  href="/"
                  className="flex items-center gap-[6px] font-sans text-[12px] text-rtfl-ink-2 hover:text-rtfl-ink"
                >
                  <span className="text-rtfl-ink-3">◀</span>back to the game
                </Link>
              </div>
            </div>
            {/* With no games loaded every day looks empty, so a plain count
                here would confidently report the whole month as unscheduled
                while it is really still loading - or failing to load. */}
            {isPending || isError ? (
              <span
                className={
                  isError
                    ? "rounded-full bg-rtfl-error/10 p-[5px_11px] font-sans text-[11.5px] text-rtfl-error"
                    : "rounded-full bg-rtfl-raised p-[5px_11px] font-sans text-[11.5px] text-rtfl-ink-2"
                }
              >
                {isError ? "could not load this month" : "loading…"}
              </span>
            ) : (
              <span
                className={
                  unscheduledAhead.length > 0
                    ? "rounded-full bg-rtfl-duplicate/10 p-[5px_11px] font-sans text-[11.5px] text-rtfl-duplicate"
                    : "rounded-full bg-rtfl-hit/10 p-[5px_11px] font-sans text-[11.5px] text-rtfl-hit"
                }
              >
                {unscheduledAhead.length > 0
                  ? `${unscheduledAhead.length} ${unscheduledAhead.length === 1 ? "day" : "days"} unscheduled`
                  : "every day ahead is scheduled"}
              </span>
            )}
          </header>

          {(error || loadError) && (
            <p className="m-0 border-b border-rtfl-line-soft bg-rtfl-error/10 p-[10px_24px] font-sans text-[12.5px] text-rtfl-error">
              {error ??
                (loadError instanceof Error ? loadError.message : "Could not load this month.")}
            </p>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-[340px_1fr] max-lg:grid-cols-1">
            <QueueRail
              month={month}
              days={days}
              selected={selected}
              isLoading={isPending}
              isError={isError}
              onSelect={handleSelect}
              onMonthChange={m => {
                setMonth(m);
                setSelected([]);
                setAnchor(null);
              }}
              onSelectAllEmpty={() => {
                setSelected(unscheduledAhead);
                setAnchor(unscheduledAhead[0] ?? null);
              }}
            />
            <AssignPanel
              selectedDays={selectedDays}
              onSchedule={handleSchedule}
              onScheduleMany={handleScheduleMany}
              onRemove={handleRemove}
              busy={busy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
