import type { Metadata } from "next";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Create your account | Shortlist" };

type Props = { searchParams: { next?: string; error?: string } };

export default function SignUpPage({ searchParams }: Props) {
  return <AuthCard mode="signup" nextPath={searchParams.next} initialError={searchParams.error} />;
}
