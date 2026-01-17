import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'
import MainNavbar from '@/components/MainNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Monad Gaming DApp - Blockchain Gaming Platform',
  description: 'Experience fun and interactive blockchain gaming on Monad!',
  generator: 'Next.js',
  themeColor: '#111827',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
          <main className="pt-16 min-h-[calc(100vh-4rem)] overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
