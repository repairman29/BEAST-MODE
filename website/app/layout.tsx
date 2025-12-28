import './globals.css'
import LibraryNavigation from '../components/library/LibraryNavigation'

export const metadata = {
  title: 'BEAST MODE - Neural Intelligence Library',
  description: 'The world\'s most advanced AI-powered development library with 9 integrated neural networks for enterprise software development',
  keywords: 'AI, library, neural networks, development, automation, enterprise, quality, intelligence, JavaScript, TypeScript',
  authors: [{ name: 'BEAST MODE Team' }],
  openGraph: {
    title: 'BEAST MODE - Neural Intelligence Library',
    description: '9 integrated AI systems in a single JavaScript library',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="neural-bg">
        <LibraryNavigation />
        {children}
      </body>
    </html>
  )
}
