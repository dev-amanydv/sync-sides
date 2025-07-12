import type { Metadata } from "next";
import Appbar from "../../components/Appbar";
import { LuLayoutDashboard } from "react-icons/lu";
import { BiVideoRecording } from "react-icons/bi";
import { GrSchedule } from "react-icons/gr";
import { IoSettingsSharp } from "react-icons/io5";
import { FaUserGear } from "react-icons/fa6";
import Logout from "../../components/Logout";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "SideRec",
  description: "Record meetings in high quality",
};


const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div>
      <Appbar />
      <div className="pt-17 bg-[#000000]">
        <div className="fixed top-[68px] bottom-0 w-[20%] pb-7 justify-between items-center flex flex-col border-r-[1px] border-[#2C2C2C]">
          <div className="flex flex-col gap-3 pt-7 items-center justify-center">
            <div className="flex items-center border-[1px] border-black cursor-pointer active:border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
              <LuLayoutDashboard className="text-[1.3rem]" />
              <h1 className="text-[1.0rem]">Dashboard</h1>
            </div>
            <div className="flex items-center border-[1px] border-black cursor-pointer active:border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
              <BiVideoRecording className="text-[1.4rem]" />
              <h1 className="text-[1.0rem]">Recordings</h1>
            </div>
            <div className="flex items-center border-[1px] border-black cursor-pointer active:border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
              <GrSchedule className="text-[1.2rem]" />
              <h1 className="text-[1.0rem]">Schedule</h1>
            </div>
            <div className="flex items-center border-[1px] border-black cursor-pointer active:border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
              <FaUserGear className="text-[1.2rem]" />
              <h1 className="text-[1.0rem]">Account</h1>
            </div>
            <div className="flex items-center border-[1px] border-black cursor-pointer active:border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
              <IoSettingsSharp className="text-[1.2rem]" />
              <h1 className="text-[1.0rem]">Settings</h1>
            </div>
          </div>
          <Logout/>
          
        </div>
        <div className="ml-[20%] w-[80%]">
        {children}
        </div>
      </div>
    </div>
  );
}
