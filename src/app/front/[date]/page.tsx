"use client";

import React from "react";
import { useParams } from "next/navigation";
import { LyricsGame } from "@/app/front/components/game/LyricsGame";
import { Toaster } from "@/app/front/components/ui/toaster";

export default function GamePage() {
  const params = useParams();
  const date = params.date as string;

  return (
    <div className="min-h-screen bg-background font-mono">
      <div className="p-8">
        <LyricsGame date={date} />
        <Toaster />
      </div>
    </div>
  );
} 