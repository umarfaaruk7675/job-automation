import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shortlist: AI that applies to jobs for you",
  description:
    "Shortlist finds jobs on official career pages worldwide, scores each one against your profile, tailors your resume using only what is true, and applies for you. If information is missing, it pauses and waits for your answer.",
};

export const viewport: Viewport = {
  themeColor: "#fdfcf8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("sl-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
