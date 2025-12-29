import HeroSection from '../components/landing/HeroSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import CallToAction from '../components/landing/CallToAction'

export default function Home() {
  return (
    <main className="min-h-screen beast-mode-bg">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CallToAction />
    </main>
  )
}
