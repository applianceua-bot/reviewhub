'use client'

import { useState } from 'react'

/**
 * Показывает реальный логотип (favicon) площадки по её домену через
 * публичный сервис Google — https://www.google.com/s2/favicons — который
 * не требует API-ключа и не имеет истории внезапных отключений (в отличие
 * от Clearbit Logo API, закрытого 8 декабря 2025 года). Если иконка всё же
 * не загрузилась, аккуратно откатываемся на бейдж с первой буквой названия.
 */
export function PlatformLogo({
  domain,
  name,
  size = 28,
  className = '',
}: {
  domain: string
  name: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {name.charAt(0)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`Логотип ${name}`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg bg-white object-contain p-1 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
