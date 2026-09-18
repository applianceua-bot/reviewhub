import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RatingRise — SERM-агентство: управление репутацией бренда, отзывы, рейтинг',
  description:
    'RatingRise — SERM-агентство по управлению онлайн-репутацией. Работаем с брендами из любой страны, оплата в USD. Вытесняем негатив из поисковой выдачи, работаем с отзывами на Trustpilot, G2 и других площадках, повышаем рейтинг бренда. Бесплатный аудит, прозрачные отчёты.',
  generator: 'v0.app',
  keywords: [
    'SERM',
    'SERM-агентство',
    'управление репутацией бренда',
    'online reputation management',
    'ORM',
    'управление отзывами',
    'вытеснение негатива из поиска',
    'рейтинг на Trustpilot',
    'международное SERM-агентство',
    'RatingRise',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'RatingRise — SERM-агентство по управлению репутацией бренда',
    description:
      'Вытесняем негатив из поиска, повышаем рейтинг на Trustpilot, G2 и других площадках и возвращаем доверие к бренду. Работаем с любой страной, оплата в USD.',
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RatingRise — SERM-агентство по управлению репутацией бренда',
    description:
      'Вытесняем негатив из поиска, повышаем рейтинг на Trustpilot, G2 и других площадках и возвращаем доверие к бренду.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#1c1a17',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
