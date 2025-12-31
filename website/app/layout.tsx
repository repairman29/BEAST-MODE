import './globals.css'
import Navigation from '../components/layout/Navigation'
import { UserProvider } from '../lib/user-context'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

export const metadata = {
  title: 'BEAST MODE - Quality Intelligence for Vibe Coders',
  description: 'AI-powered development tools for vibe coders. Quality intelligence, intelligent recommendations, and a community of developers who ship with style.',
  keywords: 'AI, development, automation, enterprise, quality, intelligence, deployment, orchestration',
  authors: [{ name: 'BEAST MODE Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'BEAST MODE - AI-Powered Development Tools',
    description: '9 integrated AI systems helping you build better code',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <ErrorBoundary>
          <UserProvider>
            <Navigation />
            {children}
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
