import type { Metadata } from "next";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Sign in | Shortlist" };

export default function SignInPage() {
  return <AuthCard mode="signin" />;
}
