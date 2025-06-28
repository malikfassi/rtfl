import React from "react";
import type { MonthArchivePageProps } from "@/app/types";
import { ArchiveContent } from "../_components/ArchiveContent";

export default async function MonthArchivePage({ params }: MonthArchivePageProps) {
  const { month } = await params;

  return <ArchiveContent month={month} />;
} 