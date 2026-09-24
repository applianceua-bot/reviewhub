import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Services } from '@/components/services'
import { Process } from '@/components/process'
import { Niches } from '@/components/niches'
import { Platforms } from '@/components/platforms'
import { PriceCalculator } from '@/components/price-calculator'
import { WorkFormats } from '@/components/work-formats'
import { CabinetDemo } from '@/components/cabinet-demo'
import { Cases } from '@/components/cases'
import { Trust } from '@/components/trust'
import { LeadForm } from '@/components/lead-form'
import { Faq } from '@/components/faq'
import { SiteFooter } from '@/components/site-footer'
import { faq } from '@/lib/site'

/** FAQPage structured data, built from the same questions the page shows. */
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <Process />
        <Niches />
        <Platforms />
        <PriceCalculator />
        <WorkFormats />
        <CabinetDemo />
        <Cases />
        <Trust />
        <Faq />
        <LeadForm />
      </main>
      <SiteFooter />
    </>
  )
}
