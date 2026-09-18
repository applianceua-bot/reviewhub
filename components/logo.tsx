import { site } from '@/lib/site'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 13.5L6.2 8.8L9.4 11.4L15.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 4.5H15.5V8.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        {site.name}
      </span>
    </span>
  )
}
