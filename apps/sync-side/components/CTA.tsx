import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <div className="w-full flex justify-center items-center py-20 px-4">
      <div className="relative w-full max-w-4xl h-[400px] rounded-3xl overflow-hidden bg-transparent border border-[#354156]/30 flex flex-col items-center justify-center gap-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#354156]/20 via-slate-950 to-slate-950" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-[#354156]/60 to-transparent opacity-50" />
        <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-[#354156]/60 to-transparent opacity-50" />
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `
         repeating-linear-gradient(45deg, rgba(53, 65, 86, 0.2) 0, rgba(53, 65, 86, 0.2) 1px, transparent 1px, transparent 12px),
        repeating-linear-gradient(-45deg, rgba(53, 65, 86, 0.2) 0, rgba(53, 65, 86, 0.2) 1px, transparent 1px, transparent 12px),
        repeating-linear-gradient(90deg, rgba(53, 65, 86, 0.1) 0, rgba(53, 65, 86, 0.1) 1px, transparent 1px, transparent 4px)
      `,
            backgroundSize: "24px 24px, 24px 24px, 8px 8px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 tracking-tight">
            Start. Record. Replay.
          </h2>

          <Link href="/auth/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#2a6677] hover:bg-[#317486]/80 text-white rounded-full font-semibold text-lg transition-colors shadow-[0_0_20px_rgba(53,65,86,0.5)] hover:shadow-[0_0_30px_rgba(53,65,86,0.7)]"
            >
              Start Today!
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CTA;
