'use client'

import { useState } from 'react'
import { Send, CheckCircle2, ArrowRight } from 'lucide-react'
import { ActionLink, ActionButton } from '@/components/action'
import { site } from '@/lib/site'

export function LeadForm() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: подключите отправку заявки (email, CRM или Telegram Bot API).
    // Пока форма показывает подтверждение на клиенте.
    setSent(true)
  }

  return (
    <section id="lead" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-6 bg-primary" />
              Обсудим ваш проект
            </span>
            <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
              Начните с бесплатного аудита репутации
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Оставьте контакты — проанализируем поисковую выдачу и отзывы о вашем бренде, покажем
              точки роста и предложим конкретный план действий. Без универсальных шаблонов и без
              обязательств.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={site.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Send className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">Telegram</span>
                    <span className="block text-sm text-muted-foreground">{site.telegramHandle}</span>
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </a>
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4 text-sm">
                <span className="text-muted-foreground">Почта</span>
                <a href={`mailto:${site.email}`} className="font-medium text-foreground hover:text-primary">
                  {site.email}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="size-12 text-primary" />
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                  Заявка отправлена
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Спасибо! Мы свяжемся с вами в течение рабочего дня. Для срочных вопросов — пишите
                  в Telegram.
                </p>
                <ActionLink
                  href={site.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  className="mt-6"
                >
                  <Send className="size-4" />
                  Написать в Telegram
                </ActionLink>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="Ваше имя" htmlFor="name">
                  <input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Иван Иванов"
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>
                <Field label="Сайт или бренд" htmlFor="brand">
                  <input
                    id="brand"
                    name="brand"
                    required
                    placeholder="example.ru"
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>
                <Field label="Телефон или email" htmlFor="contact">
                  <input
                    id="contact"
                    name="contact"
                    required
                    placeholder="+7 900 000-00-00"
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>
                <Field label="Задача (необязательно)" htmlFor="message">
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Кратко опишите ситуацию с репутацией"
                    className="w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>
                <ActionButton type="submit" size="lg" className="mt-2 w-full">
                  Отправить заявку
                  <ArrowRight className="size-4" />
                </ActionButton>
                <p className="text-center text-xs text-muted-foreground">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}
