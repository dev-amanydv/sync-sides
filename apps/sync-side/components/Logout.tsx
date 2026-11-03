"use client"
import { signOut } from 'next-auth/react';
import React from 'react'
import { TbLogout } from 'react-icons/tb';

const Logout = () => {
  return (
    <button
      onClick={() => {
        signOut({ callbackUrl: "/auth/login" });
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-white/[0.06] px-4 py-2.5 text-[#D0D3D9] transition-colors hover:bg-white/[0.04] hover:text-white"
    >
      <TbLogout className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">Logout</span>
    </button>
  )
}

export default Logout
