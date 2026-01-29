import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

const LOGO_PATH = '/images/WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png'

export const metadata: Metadata = {
  title: 'BBS Limited – Book Your Cut',
  description: 'Book your barber appointment online',
  icons: {
    icon: LOGO_PATH,
    shortcut: LOGO_PATH,
    apple: LOGO_PATH,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}
