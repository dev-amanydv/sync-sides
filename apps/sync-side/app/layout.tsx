"use client"
import localFont from "next/font/local";
import "./globals.css";
import ClientWrapper from "../ClientWrapper";
import Script from 'next/script';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

// export const metadata: Metadata = {
//   title: "SideRec",
//   description: "Record meetings in high quality",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <Script 
          src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js" 
          strategy="beforeInteractive" 
        />
        </body>
    </html>
  );
}
