"use client";

import React from "react";
import { format } from "date-fns";
import { LyricsGame } from "@/app/front/components/game/LyricsGame";

export default function TodayGamePage() {
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame date={today} />
      </div>
    </div>
  );
} 