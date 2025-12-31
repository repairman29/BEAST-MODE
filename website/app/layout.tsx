import './globals.css'
import Navigation from '../components/layout/Navigation'
import { UserProvider } from '../lib/user-context'

export const metadata = {
  title: 'BEAST MODE - Enterprise Quality Intelligence Platform',
  description: 'AI-powered development tools for vibe coders. Quality intelligence, intelligent recommendations, and a community of developers who ship with style.',
  keywords: 'AI, development, automation, enterprise, quality, intelligence, deployment, orchestration',
  authors: [{ name: 'BEAST MODE Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'BEAST MODE - AI Revolution in Development',
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
        <UserProvider>
          <Navigation />
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
