"use client";

import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Lifecycle } from "@/components/LifeCycle";
import { Features } from "@/components/Features";


export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Hero />
      <Features />
      <Lifecycle />
      <Footer />
    </div>
  );
}