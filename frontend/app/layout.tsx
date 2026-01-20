import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'
import MainNavbar from '@/components/MainNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gaming DApp - Blockchain Gaming Platform',
  description: 'Experience fun and interactive blockchain gaming on Cronos!',
  generator: ' Next.js',
  icons: {
    icon: '/x402-logo.png',
    shortcut: '/x402-logo.png',
    apple: '/x402-logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#111827',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} min-h-screen bg-gray-900 text-white overflow-auto`}>
        <Providers>
          <MainNavbar />
          <main className="pt-16 pb-16 md:pb-0 min-h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
