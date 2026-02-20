import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PrintScore™ — AI-Powered Print Compatibility Analyzer',
  description: 'Made it with AI? Let\'s make sure it prints right. GPT-4o Vision analyzes your design for print quality and gives you an accurate score.',
  keywords: ['print score', 'AI design', 'print compatibility', 'DPI checker', 'CMYK', 'print quality', 'GPT-4o'],
  openGraph: {
    title: 'PrintScore™ — AI-Powered Print Compatibility Analyzer',
    description: 'Upload your design. GPT-4o Vision analyzes it. Get an accurate print score + recommendations.',
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
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F7F7F7] min-h-screen text-[#1F1F1F] antialiased">
        {children}
      </body>
    </html>
  )
}
