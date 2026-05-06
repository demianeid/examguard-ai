import React from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Howitworks from '../components/HowItWorks'
import Footer from '../components/Footer'

const LandingPage = () => {
  return (
    <div>
      <Header />
      <Hero />
      <Features isRegistered={false} />
      <Howitworks />
      <Footer />
    </div>
  )
}

export default LandingPage
