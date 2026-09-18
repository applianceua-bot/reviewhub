import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { blogPosts, site } from '@/lib/site'

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

function getPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} — ${site.name}`,
    description: post.excerpt,
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(date),
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-16 md:pt-24">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Все статьи
      </Link>

      <span className="mt-6 inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
        {post.category}
      </span>
      <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {formatDate(post.date)} · {post.readTime} чтения
      </p>

      <div className="mt-10 flex flex-col gap-5">
        {post.content.map((paragraph, i) => (
          <p key={i} className="text-pretty leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">Нужен аудит вашей репутации?</p>
          <p className="mt-1 text-sm text-muted-foreground">Проверим выдачу и отзывы бесплатно.</p>
        </div>
        <a
          href={site.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Send className="size-4" />
          Написать в Telegram
        </a>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Читайте также</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <h3 className="font-display text-sm font-semibold leading-snug text-foreground">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
