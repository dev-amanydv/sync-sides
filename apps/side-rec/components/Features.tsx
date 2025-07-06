import { Inter } from "next/font/google";
import Image from "next/image";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const Features = () => {
  return (
    <div
      className={`grid h-[700px] max-w-6xl mx-auto w-full ${inter.className}  gap-5 grid-cols-3 grid-rows-4`}
    >
      <div className="row-span-3 rounded-xl overflow-hidden col-span-1">
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
            className="w-full absolute inset-0 opacity-70 z-40"
            alt="spotlight"
          />
          <Image
            src="/rec.gif"
            width={200}
            height={300}
            className="w-[100px] absolute top-55 right-5 opacity-40 z-40"
            alt="spotlight"
          />
          <div className="z-50 gap-5 py-4 relative px-4 h-full flex flex-col justify-end">
            <h1 className="font-semibold text-xl w-3/4 text-gray-300">
              Local Video Recording with Chunk Upload
            </h1>
            <p className="text-gray-500 text-md">
              Each participant’s media are recorded locally on their
              device and uploaded in real time in chunks for high-quality
             without relying on unstable internet.
            </p>
          </div>
        </div>
      </div>
      <div
        className="row-span-1 overflow-hidden relative rounded-xl col-span-2"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 0% 0%, #2D414A, #000000),#A39A97",
        }}
      >
        <Image
          src="/iphone.svg"
          width={200}
          height={300}
          className="w-[500px] absolute right-0 bottom-0  z-40"
          alt="spotlight"
        />
        <div className="z-50 gap-5 py-1 relative px-4 h-full flex flex-col justify-center">
          <h1 className="font-semibold text-xl w-full text-gray-300">
            Real-Time Video Meetings
          </h1>
          <p className="text-gray-500 max-w-md">
            {" "}
            SyncSides enables direct peer-to-peer video calls using modern
            WebRTC technology.
          </p>
        </div>
      </div>
      <div
        className="row-span-2 relative overflow-hidden rounded-xl col-span-1 bg-cyan-800"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 0% 100%, #121A1E, #000000),#A39A97",
        }}
      >
        <Image
          src="/chip.svg"
          width={200}
          height={300}
          className="w-[300px] absolute opacity-75 right-0 -top-20  z-30"
          alt="spotlight"
        />

        <div className="z-50 gap-5  py-1 relative px-4 h-full flex flex-col justify-end">
          <h1 className="font-semibold text-xl w-full text-gray-300">
          Side-by-Side Merge of Recordings
          </h1>
          <p className="text-gray-500 max-w-md">
            {" "}
            After the meeting, combine individual recordings into a side-by-side final video — perfect for podcasts, interviews, or collaborative discussions.
          </p>
        </div>
      </div>
      <div className="row-span-3 px-3 py-4 relative rounded-xl overflow-hidden col-span-1 bg-cyan-950" style={{
          background:
            "radial-gradient(ellipse 200% 90% at 10% 40%, #000000, #1D282E),#000000",
        }}
      >
        <Image
          src="/scroll.svg"
          width={200}
          height={300}
          className="w-[500px] absolute opacity-95 -left-5 top-9  z-30"
          alt="spotlight"
        />

        <div className="z-50 pb-5 gap-5 py-1 relative px-4 h-full flex flex-col justify-end">
          <h1 className="font-semibold text-xl w-full text-gray-300">
          No Cloud Cost, No Compromise
          </h1>
          <p className="text-gray-500 max-w-md">
            {" "}
            We built SyncSides to be cost-efficient — no expensive cloud storage or transcoding services. Everything is recorded and merged with smart, serverless processing.
          </p>
        </div></div>
      <div className="col-span-2 rounded-xl relative overflow-hidden row-span-1 bg-cyan-950"style={{
          background:
            "radial-gradient(ellipse 50% 50% at 10% 80%, #1D282E, #000000),#000000",
        }}
      >
        <Image
          src="/participants.svg"
          width={200}
          height={300}
          className="w-[900px] absolute opacity-95 left-50 -top-[200px]  z-30"
          alt="spotlight"
        />

        <div className="z-50 pb-5 gap-5 py-1 backdrop-blur-[4px] relative px-4 h-full flex flex-col justify-end">
          <h1 className="font-semibold text-xl w-full text-gray-300">
          Smart Participation Tracking & Meeting Duration

          </h1>
          <p className="text-gray-500 max-w-md">
            {" "}
            We display real-time participants and meeting duration based on the host’s active presence, giving you meaningful insights post-meeting.
            </p>
        </div></div>
    </div>
  );
};

export default Features;
