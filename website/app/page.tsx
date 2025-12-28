import LibraryLanding from '../components/library/LibraryLanding'
import LibraryFeatures from '../components/library/LibraryFeatures'
import InstallationGuide from '../components/library/InstallationGuide'
import APIDemo from '../components/library/APIDemo'

export default function Home() {
  return (
    <main className="min-h-screen neural-bg">
      <LibraryLanding />
      <LibraryFeatures />
      <InstallationGuide />
      <APIDemo />
    </main>
  )
}
