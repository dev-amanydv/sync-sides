import Image from 'next/image'
import React from 'react'

const Appbar = () => {
  return (
    <div className='fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#08090A]/90 px-4 backdrop-blur-md md:h-[68px] md:px-10'>
      <div className='flex items-center pl-10 md:pl-0'>
        <Image src={'/logo.svg'} width={220} height={70} alt='logo' className='h-8 w-auto md:h-9' priority />
      </div>
    </div>
  )
}

export default Appbar
