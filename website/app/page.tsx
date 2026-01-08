import HeroSectionEnhanced from '../components/landing/HeroSectionEnhanced'
import Day2OperationsSection from '../components/landing/Day2OperationsSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import ValueSection from '../components/landing/ValueSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import CallToAction from '../components/landing/CallToAction'

export default function Home() {
  return (
    <>
      <HeroSectionEnhanced />
      <Day2OperationsSection />
      <FeaturesSection />
      <StatsSection />
      <ValueSection />
      <TestimonialsSection />
      <CallToAction />
    </>
  )
}
