"use client";

import { redirect } from "next/navigation";
import { ROUTES } from "@/app/front/lib/routes";

export default function NotFound() {
  // Redirect to home with error message
  redirect(`${ROUTES.HOME}?error=not_found&message=${encodeURIComponent('Page not found')}`);
} 