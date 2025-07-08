"use client";
import React from "react";
import { SparklesCore } from "./Sparkles";
import { Inter } from "next/font/google";


const inter = Inter({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
  });

export function SparklesPreview() {
  return (
    <div className="h-[20rem] mt-40 w-full bg-transparent flex flex-col items-center justify-center overflow-hidden rounded-md">
      <h1 className={`md:text-7xl ${inter.className} text-3xl lg:text-9xl font-semibold text-center text-gray-500 relative z-20`}>
        SYNCSIDES
      </h1>
      <div className="w-[40rem] h-20 relative">
        {/* Gradients */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1.5}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#16F3FF"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div
        style={{
          WebkitMaskImage: "radial-gradient(ellipse 100% 50% at 50% 0%, transparent, #0A0C0C)",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, transparent, #0A0C0C)"
        }} className="absolute inset-0 w-full h-full bg-[#000] md:bg-[#0A0C0C]"></div>
      </div>
    </div>
  );
}
