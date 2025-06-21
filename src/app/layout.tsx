import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import SimpleNetworkIndicator from '@/components/SimpleNetworkIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web3 DApp Platform',
  description: 'Modern Web3 DApp Platform with Voting and Banking Systems',
  keywords: ['Web3', 'DApp', 'Ethereum', 'Voting', 'Banking', 'DeFi'],
  authors: [{ name: 'Web3 DApp Platform Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>
          <div className="min-h-full">
            {children}
          </div>
          <SimpleNetworkIndicator />
        </Providers>
      </body>
    </html>
  )
} 