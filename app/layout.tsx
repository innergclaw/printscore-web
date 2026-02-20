import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PrintScore - AI Design Print Compatibility Analyzer',
  description: 'Made it with AI? Let\'s make sure it prints right. Upload your design and get an instant Print Score.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg-light min-h-screen">
        {children}
      </body>
    </html>
  )
}
