import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

const sans = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shortlist: job applications you'd sign your name to",
  description:
    "Fresh jobs from company career pages, a resume tailored to each one, and nothing sent without your approval.",
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
