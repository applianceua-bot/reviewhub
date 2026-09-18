export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
}) {
  const isCenter = align === 'center'
  return (
    <div className={isCenter ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
        <span className="h-px w-6 bg-primary" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-pretty leading-relaxed text-muted-foreground ${
            isCenter ? 'mx-auto' : ''
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}
