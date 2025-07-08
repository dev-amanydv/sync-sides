"use client";

import { useRouter } from "next/navigation";
import LandingPage from "../components/LandingPage";
import { LampDemo } from "../components/ui/Lamp";

export default function HomePage() {
  
  const router = useRouter();


  return (
    <div>
      <LandingPage/>
    </div>
  );
}