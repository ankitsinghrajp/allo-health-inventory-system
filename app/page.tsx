"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Footer } from "@/components/Footer";
import { Lifecycle } from "@/components/LifeCycle";
import { Features } from "@/components/Features";


export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Lifecycle />
      <Footer />
    </div>
  );
}