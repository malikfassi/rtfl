"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ArchiveContent } from "@/app/front/archive/_components/ArchiveContent";

export default function MonthArchivePage() {
  const params = useParams();
  const month = params.month as string;

  return <ArchiveContent month={month} />;
} 