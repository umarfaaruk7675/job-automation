import type { Metadata } from "next";
import { Suspense } from "react";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Create your account | Shortlist" };

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthCard mode="signup" />
    </Suspense>
  );
}
