"use client";

import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "The local recording feature is a lifesaver. No more pixelated guest video due to bad internet. SyncSides delivers studio-quality output every time.",
    name: "Aarav Sharma",
    title: "Tech Podcaster",
    avatar: "AS",
  },
  {
    quote:
      "I used to spend hours syncing audio and video manually. SyncSides' side-by-side merging does it instantly. It's magic for my interview series.",
    name: "Priya Kapoor",
    title: "Content Creator",
    avatar: "PK",
  },
  {
    quote:
      "Finally, a platform that understands the needs of remote interviewers. The HD quality is consistent, and the interface is incredibly intuitive.",
    name: "Rohan Mehta",
    title: "Senior Journalist",
    avatar: "RM",
  },
  {
    quote:
      "We use SyncSides for all our candidate interviews. The participation tracking and seamless recording make our hiring process so much smoother.",
    name: "Ananya Singh",
    title: "HR Manager",
    avatar: "AS",
  },
  {
    quote:
      "The best investment for my channel. The dark mode is sleek, and the reliability of local video capture is unmatched by any other tool.",
    name: "Vikram Malhotra",
    title: "YouTuber",
    avatar: "VM",
  },
];

const Testimonials = () => {
  return (
    <div className="h-[20rem] rounded-md my-10 flex flex-col antialiased bg-transparent dark:bg-grid-white/[0.05] items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-7xl px-4 md:px-8 lg:px-10 relative">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-neutral-500">
          Loved By Many
        </h2>
        
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
            <motion.div
                className="flex gap-4 pr-4"
                animate={{
                    x: ["0%", "-50%"],
                }}
                transition={{
                    duration: 30,
                    ease: "linear",
                    repeat: Infinity,
                }}
                whileHover={{
                    animationPlayState: "paused",
                }}
            >
                {[...testimonials, ...testimonials].map((item, idx) => (
                    <div
                        key={`${item.name}-${idx}`}
                        className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px] group hover:border-slate-500 transition-colors duration-300"
                        style={{
                            background: "linear-gradient(180deg, var(--slate-800), var(--slate-900)",
                        }}
                    >
                         {/* Glow effect on hover */}
                        <div className="absolute inset-0 -z-10 rounded-2xl bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                        <blockquote>
                            <div
                                aria-hidden="true"
                                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                            ></div>
                            <span className=" relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                                "{item.quote}"
                            </span>
                            <div className="relative z-20 mt-6 flex flex-row items-center">
                                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold mr-4">
                                    {item.avatar}
                                </div>
                                <span className="flex flex-col gap-1">
                                    <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                                        {item.name}
                                    </span>
                                    <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                                        {item.title}
                                    </span>
                                </span>
                            </div>
                        </blockquote>
                    </div>
                ))}
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
