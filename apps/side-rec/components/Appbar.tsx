import Image from 'next/image'
import React from 'react'

const Appbar = () => {
  return (
    <div className='w-screen fixed top-0 left-0 border-b-[1px] border-[#2C2C2C] flex justify-between items-center px-10 bg-[#0A0A0A] h-17'>
      <div className='flex justify-center items-center'>
        <Image src={'/logo.svg'} width={300} height={100} alt='logo' />
      </div>
    </div>
  )
}

export default Appbar
