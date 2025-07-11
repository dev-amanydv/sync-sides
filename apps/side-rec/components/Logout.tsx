"use client"
import { signOut } from 'next-auth/react';
import React from 'react'
import { TbLogout } from 'react-icons/tb';

const Logout = () => {
  return (
    <button onClick={() => {
        signOut({ callbackUrl: "/auth/login" });
      }} className="flex items-center border-[1px] border-[#2C2C2C] hover:bg-[#2C2C2C] text-white px-6 w-50 py-1.5 rounded-md gap-2">
          <TbLogout className="text-[1.8rem]" />
          <h1 className="text-[1.0rem]">Logout</h1>
        </button>
  )
}

export default Logout
