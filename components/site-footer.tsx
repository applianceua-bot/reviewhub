import { Send } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { nav, site } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              SERM-агентство по управлению репутацией бренда: работаем с брендами из любой страны, оплата в USD.
            </p>
            <a
              href={site.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40"
            >
              <Send className="size-4 text-primary" />
              {site.telegramHandle}
            </a>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-sm font-medium text-foreground">Навигация</p>
              <ul className="mt-4 flex flex-col gap-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Контакты</p>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <li>
                  <a href={`mailto:${site.email}`} className="transition-colors hover:text-foreground">
                    {site.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="transition-colors hover:text-foreground">
                    {site.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {site.name}. Все права защищены.
          </span>
          <span>Управление репутацией бренда</span>
        </div>
      </div>
    </footer>
  )
}
