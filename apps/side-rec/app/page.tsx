"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  
  const router = useRouter();


  return (
    <main className="p-6 w-screen h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-semibold mb-4">Welcome to SideRec</h1>

      <div className="mb-4 flex flex-col gap-5 space-y-2 max-w-md">
       <button className="bg-purple-900 px-4 py-2 rounded-lg" onClick={()=> {
        router.push('/auth/signup')
       }}>Get Started</button>
      </div>
    </main>
  );
}