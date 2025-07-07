import React from 'react'
import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'

const LandingPage = () => {
  return (
    <div className="relative h-[3000px] md:h-[2300px] w-screen">
      <div className="absolute inset-0 bg-[url('/element-3.svg')] bg-no-repeat bg-center bg-cover z-0" />
      <div className="absolute inset-0 backdrop-blur-xl bg-black/30 z-10" />


      <div className="relative z-50 px-10 py-5">
        <Navbar/>
        <Hero/>
        <Features/>
      </div>
    </div>
  )
}

export default LandingPage
