import type { Metadata } from "next";

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
    <html lang="en">
      <body >
        {children}
      </body>
    </html>
  );
}
