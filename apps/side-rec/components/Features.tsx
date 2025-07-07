import { motion } from "motion/react";
import { Inter } from "next/font/google";
import Image from "next/image";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const Features = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay:0.5 }}
      viewport={{ once: true, amount: 0.2 }}
      className={`grid h-auto md:h-[700px] max-w-6xl my-0 md:my-68 mx-auto w-full ${inter.className}  gap-5 grid-cols-1 md:grid-cols-3 grid-rows-5 md:grid-rows-4`}
    >
      <div className="row-span-1 md:row-span-3 rounded-xl overflow-hidden col-span-1 group">
        <div className="h-full w-full relative bg-transparent">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 100% 100% at 50% 0%, #23323A, transparent 90%), #000000",
            }}
          />
          <Image
            src="/spotlight.svg"
            width={300}
            height={300}
            className="w-full absolute inset-0 opacity-40 md:opacity-70 z-40"
            alt="spotlight"
          />
          <Image
            src="/rec.gif"
            width={200}
            height={300}
            className="w-[50px] md:w-[50px] absolute top-5 md:top-5 right-2 md:right-5 opacity-80 z-40"
            alt="spotlight"
          />
          <div className="z-50 px-5 relative h-full flex flex-col  justify-end">
            <motion.h1 className="font-semibold text-3xl w-3/4 text-gray-300 transform transition-all duration-300 group-hover:-translate-y-20">
              Local Video Recording with Chunk Upload
            </motion.h1>
            <motion.p  className="text-gray-400  text-md opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-15 duration-300">
              Each participant’s media are recorded locally on their
              device and uploaded in real time in chunks for high-quality
             without relying on unstable internet.
            </motion.p>
          </div>
        </div>
      </div>
      <div
        className="row-span-1 group md:row-span-1 overflow-hidden relative rounded-xl col-span-1 md:col-span-2"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 0% 0%, #2D414A, #000000),#A39A97",
        }}
      >
        <Image
          src="/iphone.svg"
          width={200}
          height={300}
          className="w-[500px] group-hover:scale-140 transition-all duration-300  group-hover:-translate-x-24 group-hover:-translate-y-5 absolute right-0 bottom-0  z-40"
          alt="spotlight"
        />
        <div className="z-50 py-1 relative px-4 h-full flex flex-col justify-center">
          <motion.h1 initial={{y:50}} className="font-semibold group-hover:-translate-y-16 transition-all duration-300  text-3xl w-full text-gray-300">
            Real-Time Video Meetings
          </motion.h1>
          <motion.p  className="text-gray-300 max-w-sm  opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-0 duration-300">
            {" "}
            SyncSides enables direct peer-to-peer video calls using modern
            WebRTC technology.
          </motion.p>
        </div>
      </div>
      <div
        className="row-span-1 group md:row-span-2 relative overflow-hidden rounded-xl col-span-1 md:col-span-1 bg-cyan-800"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 0% 100%, #121A1E, #000000),#A39A97",
        }}
      >
        <Image
          src="/chip.svg"
          width={200}
          height={300}
          className="w-[300px] group-hover:scale-200  group-hover:opacity-100 transition-all duration-300 absolute opacity-75 right-0 -top-20  z-30"
          alt="spotlight"
        />

        <div className="z-50  py-1 relative px-4 h-full flex flex-col justify-end">
          <motion.h1 initial={{y:65}}  className="font-semibold group-hover:-translate-y-20 text-3xl transition-all duration-300  w-full text-gray-300">
          Side-by-Side Merge of Recordings
          </motion.h1>
          <p  className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 max-w-md">
            {" "}
            After the meeting, combine individual recordings into a side-by-side final video — perfect for podcasts, interviews, or collaborative discussions.
          </p>
        </div>
      </div>
      <div className="row-span-1 group md:row-span-3 px-3 py-4 relative rounded-xl overflow-hidden rol-span-1 md:col-span-1 bg-cyan-950" style={{
          background:
            "radial-gradient(ellipse 200% 90% at 10% 40%, #000000, #1D282E),#000000",
        }}
      >
        <Image
          src="/scroll.svg"
          width={200}
          height={300}
          className="w-[500px] absolute group-hover:scale-130 transition-all duration-300  hidden md:block opacity-95 -left-5 top-9  z-30"
          alt="spotlight"
        />

        <div className="z-50 pb-5 gap-5 py-1 relative px-4 h-full flex flex-col justify-end">
          <motion.h1 initial={{y:60}} className="font-semibold group-hover:-translate-y-14 transition-all duration-300 text-3xl w-full text-gray-300">
          No Cloud Cost, No Compromise
          </motion.h1>
          <p  className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 max-w-md">
            {" "}
            We built SyncSides to be cost-efficient — no expensive cloud storage or transcoding services. Everything is recorded and merged with smart, serverless processing.
          </p>
        </div></div>
      <div className="col-span-1 group md:col-span-2 rounded-xl relative overflow-hidden row-span-1 md:row-span-1 bg-cyan-950"style={{
          background:
            "radial-gradient(ellipse 50% 50% at 90% 10%, #1D282E, #000000),#000000",
        }}
      >
        <Image
          src="/participants.svg"
          width={200}
          height={300}
          className="w-[900px] group-hover:scale-150 transition-all duration-300  absolute opacity-95 left-20  md:left-50 -top-20 md:-top-[500px]  z-30"
          alt="spotlight"
        />

        <div className="z-50 pb-5 gap-5 py-1 backdrop-blur-[4px] relative px-4 h-full flex flex-col justify-end">
          <motion.h1 initial={{y:50}} className="font-semibold group-hover group-hover:-translate-y-10 transition-all duration-300 text-3xl w-full text-gray-300">
          Smart Participation Tracking & Meeting Duration

          </motion.h1>
          <p  className="text-gray-500 opacity-0 transition-all duration-300 group-hover:opacity-100 max-w-md">
            {" "}
            We display real-time participants and meeting duration based on the host’s active presence, giving you meaningful insights post-meeting.
            </p>
        </div></div>
    </motion.div>
  );
};

export default Features;
