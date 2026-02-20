import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PrintScore™ — AI Design Print Compatibility Analyzer',
  description: 'Made it with AI? Let\'s make sure it prints right. Upload your design and get an instant Print Score + PDF report.',
  keywords: ['print score', 'AI design', 'print compatibility', 'DPI checker', 'CMYK', 'print quality'],
  openGraph: {
    title: 'PrintScore™ — AI Design Print Compatibility Analyzer',
    description: 'Made it with AI? Let\'s make sure it prints right. Upload your design and get an instant Print Score + PDF report.',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg min-h-screen text-text antialiased">
        {children}
      </body>
    </html>
  )
}
