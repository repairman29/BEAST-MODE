import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vibe Check - Code Quality Dashboard',
  description: 'Beautiful code quality dashboard built with BEAST MODE',
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

