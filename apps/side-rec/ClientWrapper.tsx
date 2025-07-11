"use client"
import React from 'react'
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from 'recoil';

const ClientWrapper = ({children}: { children:React.ReactNode} ) => {
  return (
    <RecoilRoot>
    <SessionProvider>
      {children}
    </SessionProvider>
    </RecoilRoot>
  )
}

export default ClientWrapper
