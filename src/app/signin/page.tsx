import type { Metadata } from "next";
import { Suspense } from "react";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Sign in | Shortlist" };

export default function SignInPage() {
  return (
    <Suspense>
      <AuthCard mode="signin" />
    </Suspense>
  );
}
