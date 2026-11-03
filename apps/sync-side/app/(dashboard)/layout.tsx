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
  const baseStyle = "flex items-center cursor-pointer px-3.5 w-full py-2.5 rounded-lg gap-3 transition-colors duration-150 text-[13px] font-medium";
  const activeStyle = "bg-white/[0.06] text-[#F7F8F8]";
  const inactiveStyle = "text-[#8A8F98] hover:bg-white/[0.03] hover:text-[#D0D3D9]";

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
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] antialiased [font-family:var(--font-geist-sans)]">
      {/* Appbar with hamburger button for mobile */}
      <div className="relative">
        <Appbar />

        {/* Mobile hamburger button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden fixed top-3.5 left-3 z-50 p-2 rounded-lg border border-white/[0.06] bg-white/[0.04] text-white transition-colors duration-200 hover:bg-white/[0.08]"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <HiX className="text-xl" />
          ) : (
            <HiMenuAlt3 className="text-xl" />
          )}
        </button>
      </div>

      <div className="pt-16 md:pt-[68px]">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-16 md:top-[68px] bottom-0 left-0
          w-64 md:w-[240px]
          pb-6
          justify-between items-stretch flex flex-col
          border-r border-white/[0.06]
          bg-[#08090A]
          transition-transform duration-300 ease-in-out
          z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 pt-5 items-stretch justify-start w-full px-3">
            {navigationItems.map((item) => (
              <div
                key={item.path}
                className={`${baseStyle} ${isActive(item.path) ? activeStyle : inactiveStyle}`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Logout Section */}
          <div className="w-full px-3">
            <Logout />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:ml-[240px] min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-68px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
