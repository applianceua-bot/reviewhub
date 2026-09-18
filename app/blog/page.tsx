import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { blogPosts, site } from '@/lib/site'

export const metadata: Metadata = {
  title: `Блог — ${site.name}`,
  description:
    'Статьи о SERM и управлении онлайн-репутацией бренда для международных компаний — простым языком, без воды.',
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(date),
  )
}

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-16 md:pt-24">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          <span className="h-px w-6 bg-primary" />
          Блог
        </span>
        <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight md:text-5xl">
          Заметки об управлении репутацией
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Разбираем SERM, работу с отзывами и репутационные стратегии для брендов из любой страны —
          простым языком, без воды.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              {post.category}
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-foreground">
              {post.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>
                {formatDate(post.date)} · {post.readTime}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-primary transition-transform group-hover:translate-x-1">
                Читать
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
