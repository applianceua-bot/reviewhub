import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { RevealObserver } from '@/components/reveal-observer'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Управление репутацией бренда в интернете — SERM-агентство RatingRise',
  description:
    'SERM-агентство RatingRise: вытесняем негатив из поиска Google, работаем с отзывами на Trustpilot, G2 и в App Store, поднимаем рейтинг бренда. Бесплатный аудит репутации.',
  generator: 'v0.app',
  keywords: [
    'управление репутацией бренда',
    'управление репутацией в интернете',
    'SERM',
    'SERM-агентство',
    'ORM',
    'online reputation management',
    'управление отзывами',
    'удаление негативных отзывов',
    'вытеснение негатива из поиска',
    'рейтинг на Trustpilot',
    'отзывы на G2 и Capterra',
    'репутация в crypto, iGaming, fintech, SaaS, affiliate и dating',
    'RatingRise',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Управление репутацией бренда в интернете — RatingRise',
    description:
      'Вытесняем негатив из поиска, работаем с отзывами и поднимаем рейтинг на Trustpilot, G2, в Google и App Store. Работаем с компаниями из любой страны.',
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Управление репутацией бренда в интернете — RatingRise',
    description:
      'Вытесняем негатив из поиска, работаем с отзывами и поднимаем рейтинг на Trustpilot, G2, в Google и App Store.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#171414',
}

// Marks the page as JS-enabled before first paint so scroll-reveal content
// starts hidden only when it can actually be revealed. If the observer never
// mounts (script error), the class is dropped and everything shows.
const revealBootstrap =
  "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__rrReveal)document.documentElement.classList.remove('js')},3000)"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${manrope.variable} bg-background`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <RevealObserver />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
