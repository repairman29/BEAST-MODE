import './globals.css'
import Navigation from '../components/layout/Navigation'

export const metadata = {
  title: 'BEAST MODE - Enterprise Quality Intelligence Platform',
  description: 'The world\'s most advanced AI-powered development ecosystem with 9 integrated AI systems for maximum productivity',
  keywords: 'AI, development, automation, enterprise, quality, intelligence, deployment, orchestration',
  authors: [{ name: 'BEAST MODE Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'BEAST MODE - AI Revolution in Development',
    description: '9 integrated AI systems working in perfect harmony',
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
        <Navigation />
        {children}
      </body>
    </html>
  )
}
