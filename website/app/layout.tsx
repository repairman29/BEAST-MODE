import './globals.css'
import Navigation from '../components/layout/Navigation'
import { UserProvider } from '../lib/user-context'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

export const metadata = {
  title: 'BEAST MODE - Quality Intelligence for Vibe Coders',
  description: 'AI-powered development tools for vibe coders. Quality intelligence, intelligent recommendations, and a community of developers who ship with style.',
  keywords: 'AI, development, automation, enterprise, quality, intelligence, deployment, orchestration, code quality, developer tools, AI coding assistant',
  authors: [{ name: 'BEAST MODE Team' }],
  creator: 'BEAST MODE',
  publisher: 'BEAST MODE',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'BEAST MODE - AI-Powered Development Tools',
    description: '9 integrated AI systems helping you build better code. Quality intelligence, automated fixes, and intelligent recommendations.',
    type: 'website',
    siteName: 'BEAST MODE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BEAST MODE - AI-Powered Development Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BEAST MODE - AI-Powered Development Tools',
    description: '9 integrated AI systems helping you build better code',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://beastmode.dev',
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
