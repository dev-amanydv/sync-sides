import type { Metadata } from "next";
import localFont from "next/font/local";

export const metadata: Metadata = {
  title: "SideRec",
  description: "Record meetings in high quality",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
        {children}
    </div>
  );
}
