import { motion } from 'motion/react'
import React from 'react'
import { FaChevronRight, FaCircle } from 'react-icons/fa6'
import { Inter } from 'next/font/google'
import { GoDeviceCameraVideo } from 'react-icons/go';
import { LuUsersRound } from 'react-icons/lu';
import Image from 'next/image';

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

const Hero = () => {
  return (
    <div className={`flex flex-col my-36 w-full items-center gap-10 ${inter.className}`}>
        <div className='flex gap-1 bg-cyan-900 px-4 py-1 rounded-full text-sm text-gray-300 items-center'>
            <p className=''>Goodbye, low-res and pixelation </p>
            <span><FaChevronRight />
            </span>
        </div>
        <div className='flex flex-col w-full gap-5 items-center'>
            <div className='flex gap-1'>
               <h1 className='text-[2rem] text-center md:text-[3rem] font-medium bg-gradient-to-b from-gray-100 via-gray-300 to-[#273234] bg-clip-text text-transparent'>Record High Quality Meetings Locally </h1>
               <motion.span
                 className='relative'
                 animate={{ opacity: [1, 0, 1] }}
                 transition={{ duration: 2, repeat: Infinity, }}
               >
                 <FaCircle className='absolute -left-10 md:left-0 bottom-4 size-3 text-red-600' />
               </motion.span>
            </div>
            <p className='text-gray-300 max-w-2xl text-center text-lg'>SyncSides captures both participants locally and merges them for crisp, professional recordings. No more pixelated meeting recordings.</p>
            <div className='flex md:flex-row flex-col gap-5 mt-5'>
              <button className='bg-cyan-950 hover:bg-cyan-800 transition ease-in-out duration-300 flex px-4 py-3 rounded-lg gap-2 items-center'>
                <div><GoDeviceCameraVideo className='text-2xl text-white'/>
                </div>
                <span className='text-white'>Start Recording</span>
              </button>
              <button className='border-[2px] hover:bg-cyan-800 hover:text-gray-900 transition ease-in-out duration-300 border-cyan-950 flex px-4 py-3 rounded-lg gap-2 items-center'>
                <div><LuUsersRound className='text-cyan-300 text-2xl hover:text-gray-900 transition ease-in-out duration-300' /></div>
                <span className='text-cyan-300 hover:text-gray-900 transition ease-in-out duration-300'>Join Meeting</span>
              </button>
            </div>
        </div>
    </div>
  )
}

export default Hero
