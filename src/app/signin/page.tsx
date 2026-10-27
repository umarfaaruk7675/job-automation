import type { Metadata } from "next";
import { Component as AuthCard } from "@/components/ui/sign-in-flo";

export const metadata: Metadata = { title: "Sign in | Shortlist" };

type Props = { searchParams: { next?: string; error?: string } };

export default function SignInPage({ searchParams }: Props) {
  return <AuthCard mode="signin" nextPath={searchParams.next} initialError={searchParams.error} />;
}
