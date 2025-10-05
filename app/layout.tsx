import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'
import { I18nProvider } from '@/components/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CV Portfolio - Interactive Resume',
  description: 'Modern animated CV portfolio with AI chatbot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <I18nProvider>
          <Providers>
            {children}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  )
}