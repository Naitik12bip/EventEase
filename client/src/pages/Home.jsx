import React from 'react'
import HeroSection from '../components/HeroSection'
import FeaturedSection from '../components/FeaturedSection'
import TrailersSection from '../components/TrailersSection'

const Home  = () => {
  return(
    <>
      <HeroSection />
      <FeaturedSection />

      <div className="border-t-4 border-yellow-500 mt-10">
         <TrailersSection />
      </div>

      <div className="h-40"></div>
    </>
  )
}

export default Home 