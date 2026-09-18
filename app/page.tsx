import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Services } from '@/components/services'
import { Niches } from '@/components/niches'
import { Platforms } from '@/components/platforms'
import { PriceCalculator } from '@/components/price-calculator'
import { WorkFormats } from '@/components/work-formats'
import { Cases } from '@/components/cases'
import { LeadForm } from '@/components/lead-form'
import { Faq } from '@/components/faq'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <Niches />
        <Platforms />
        <PriceCalculator />
        <WorkFormats />
        <Cases />
        <LeadForm />
        <Faq />
      </main>
      <SiteFooter />
    </>
  )
}
