import Image from 'next/image'
import React from 'react'

const HowItWorks = () => {
  return (
    <div className='w-full mx-auto'>
      <h1 className='text-5xl text-center my-10 text-white font-semibold'>How it works?</h1>
      <Image src={'/howItWorks2.svg'} width={500} height={500} className='w-full' alt='how it works?'/>
    </div>
  )
}

export default HowItWorks
