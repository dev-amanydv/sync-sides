"use client"
import { useState } from "react";
import Appbar from "../../components/Appbar";
import { LuLayoutDashboard } from "react-icons/lu";
import { BiVideoRecording } from "react-icons/bi";
import { GrSchedule } from "react-icons/gr";
import { IoSettingsSharp } from "react-icons/io5";
import { FaUserGear } from "react-icons/fa6";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import Logout from "../../components/Logout";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  
  // Base styles for navigation items
  const baseStyle = "flex items-center border border-black cursor-pointer text-white px-4 md:px-6 w-full py-2 md:py-1.5 rounded-md gap-3 transition-all duration-200";
  const activeStyle = "border-[#2C2C2C] bg-[#2C2C2C]";

  // Navigation items data
  const navigationItems = [
    {
      path: "/dashboard",
      icon: <LuLayoutDashboard className="text-xl md:text-[1.3rem] flex-shrink-0" />,
      label: "Dashboard"
    },
    {
      path: "/recordings", 
      icon: <BiVideoRecording className="text-xl md:text-[1.4rem] flex-shrink-0" />,
      label: "Recordings"
    },
    {
      path: "/schedule",
      icon: <GrSchedule className="text-lg md:text-[1.2rem] flex-shrink-0" />,
      label: "Schedule"
    },
    {
      path: "/account",
      icon: <FaUserGear className="text-lg md:text-[1.2rem] flex-shrink-0" />,
      label: "Account"
    },
    {
      path: "/settings",
      icon: <IoSettingsSharp className="text-lg md:text-[1.2rem] flex-shrink-0" />,
      label: "Settings"
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Appbar with hamburger button for mobile */}
      <div className="relative">
        <Appbar />
        
        {/* Mobile hamburger button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2C2C2C] text-white hover:bg-[#383838] transition-colors duration-200"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <HiX className="text-xl" />
          ) : (
            <HiMenuAlt3 className="text-xl" />
          )}
        </button>
      </div>

      <div className="pt-16 md:pt-17">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-16 md:top-[68px] bottom-0 
          w-64 md:w-[20%] 
          pb-6 md:pb-7 
          justify-between items-center flex flex-col 
          border-r border-[#2C2C2C] 
          bg-[#000000] 
          transition-transform duration-300 ease-in-out
          z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          
          {/* Navigation Items */}
          <div className="flex flex-col gap-2 md:gap-3 pt-6 md:pt-7 items-center justify-start w-full px-4 md:px-4">
            {navigationItems.map((item) => (
              <div 
                key={item.path}
                className={`${baseStyle} ${isActive(item.path) ? activeStyle : "hover:bg-[#2C2C2C]"}`} 
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                <h1 className="text-sm md:text-[1.0rem] font-medium">{item.label}</h1>
              </div>
            ))}
          </div>

          {/* Logout Section */}
          <div className="w-full px-4 md:px-0 flex justify-center">
            <Logout />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ml-0 md:ml-[20%] w-full md:w-[80%] min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-68px)]">
          <div className="p-0 md:p-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
