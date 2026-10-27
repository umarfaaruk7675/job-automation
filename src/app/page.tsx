import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { ResumeUpload } from "@/components/sections/ResumeUpload";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <ResumeUpload />
      </main>
    </>
  );
}
