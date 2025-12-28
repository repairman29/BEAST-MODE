import './globals.css'

export const metadata = {
  title: 'BEAST MODE - Enterprise Quality Intelligence Platform',
  description: 'The world\'s most advanced AI-powered development ecosystem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
