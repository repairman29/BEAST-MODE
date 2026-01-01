import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import Day2OperationsSection from '../components/landing/Day2OperationsSection'
import StatsSection from '../components/landing/StatsSection'
import CallToAction from '../components/landing/CallToAction'

export default function Home() {
  return (
    <>
      <HeroSection />
      <Day2OperationsSection />
      <FeaturesSection />
      <StatsSection />
      <CallToAction />
    </>
  )
}
