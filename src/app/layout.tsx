import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { TranslationProvider } from '@/components/providers/TranslationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bagami - Smart Community-Powered Deliveries',
  description: 'Join the future of delivery with Bagami - where community meets convenience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TranslationProvider>
          <NextAuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </NextAuthProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}