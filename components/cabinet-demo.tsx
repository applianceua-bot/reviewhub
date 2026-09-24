import Link from 'next/link'
import { BarChart3, CalendarCheck, FileText, Flag, LayoutDashboard, MessagesSquare, Star } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { OverviewView } from '@/components/dash/overview-view'
import { DemoBadge } from '@/components/dash/ui'
import { demoOverview } from '@/lib/dash/demo'
import { dashFont } from '@/lib/dash/font'

const FEATURES = [
  { icon: BarChart3, text: 'Рейтинг по каждой площадке и путь до целевого' },
  { icon: Star, text: 'Новые отзывы и наши ответы на них' },
  { icon: Flag, text: 'Какие фейковые отзывы площадки уже удалили' },
  { icon: CalendarCheck, text: 'План работ и еженедельные отчёты' },
]

const MENU = [
  { icon: LayoutDashboard, label: 'Обзор', active: true },
  { icon: Star, label: 'Отзывы' },
  { icon: Flag, label: 'Проверка на удаление' },
  { icon: MessagesSquare, label: 'Упоминания' },
  { icon: CalendarCheck, label: 'План работ' },
  { icon: FileText, label: 'Отчёты' },
]

/** Landing preview of the client cabinet, rendered with the real dashboard components on fictional data. */
export function CabinetDemo() {
  return (
    <section id="cabinet" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Личный кабинет"
            title="Следите за ходом работы в своём дашборде"
            description="У каждого клиента свой кабинет со входом по логину и паролю. В нём видно только ваши бренды: рейтинг, отзывы, удалённые фейки, план работ и отчёты. Данные обновляются каждую неделю."
          />
          <ul data-reveal className="grid shrink-0 gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:w-[420px] lg:grid-cols-1">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="mt-12 overflow-hidden rounded-2xl border border-border shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-white/5 bg-[#0b0c0d] px-4 py-2.5">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <span className="mx-auto truncate rounded-md bg-white/5 px-4 py-1 text-xs text-white/50">cabinet · Nordvik Pay</span>
          </div>

          <div className={`dash ${dashFont.variable} flex`} aria-label="Пример личного кабинета на вымышленных данных">
            <aside className="hidden w-52 shrink-0 border-r border-border bg-card p-3 lg:block" aria-hidden="true">
              <p className="px-2.5 pb-3 text-sm font-semibold">Nordvik Pay</p>
              {MENU.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`mb-0.5 flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm ${
                    active ? 'bg-primary/12 text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`size-4 ${active ? 'text-primary' : ''}`} />
                  {label}
                </div>
              ))}
            </aside>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <p className="font-semibold">Nordvik Pay</p>
                  <p className="text-xs text-muted-foreground">Fintech · вымышленный бренд</p>
                </div>
                <DemoBadge />
              </div>
              <div className="p-4 md:p-6">
                <OverviewView data={demoOverview()} />
              </div>
            </div>
          </div>
        </div>

        <div data-reveal className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a
            href="#lead"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Получить кабинет для своего бренда
          </a>
          <Link href="/login" className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm text-foreground transition-colors hover:bg-secondary">
            Вход для клиентов
          </Link>
          <p className="text-xs text-muted-foreground sm:ml-2">Цифры на примере вымышленные.</p>
        </div>
      </div>
    </section>
  )
}
