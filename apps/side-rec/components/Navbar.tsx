import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { RxAvatar } from 'react-icons/rx'

const Navbar = () => {
  return (
    <motion.div initial={{y:-100}} animate={{y:0}} transition={{duration:0.3, delay:0.5}} className='w-full max-w-7xl mx-auto flex items-center justify-between h-16'>
      <div><Image src={'/logo.svg'} width={300} height={100} className='cursor-pointer' alt='logo'/> </div>
      
      <div className='hidden md:flex items-center gap-5'>
        <Link href={'/auth/login'}>
        <button className='text-white cursor-pointer hover:bg-transparent border-[1px] border-transparent hover:border-[1px] hover:border-cyan-500 transition ease-in-out duration-300 px-4 py-2 rounded-full'> Login</button>
        </Link>
        <Link href={'/auth/signup'}>
        <button className='flex cursor-pointer hover:bg-gray-950 border-[1px] border-transparent hover:border-[1px] hover:border-cyan-500 transition ease-in-out duration-300 gap-2 bg-cyan-800/40 px-3 py-2 rounded-full  items-center '><RxAvatar className='text-white text-2xl' /><h1 className='text-white'>Create Account</h1></button>
        </Link>
      </div>
    </motion.div>
  )
}

export default Navbar
