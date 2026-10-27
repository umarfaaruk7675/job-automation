import type { Metadata } from "next";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Create your account | Shortlist" };

export default function SignUpPage() {
  return <AuthCard mode="signup" />;
}
