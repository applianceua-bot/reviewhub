'use client'

import { useEffect } from 'react'

/**
 * Reveals `[data-reveal]` elements as they scroll into view by setting
 * `data-revealed` (styles live in globals.css). An attribute rather than a
 * class: React rewrites `className` on re-render and would wipe a class added
 * here, hiding the element again; it leaves attributes it never set alone.
 * Mounted once in the root layout; a MutationObserver picks up elements
 * rendered later — client-side navigation, filtered lists — so nothing stays
 * hidden.
 */
export function RevealObserver() {
  useEffect(() => {
    ;(window as Window & { __rrReveal?: boolean }).__rrReveal = true

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', '')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    const observe = (root: ParentNode) => {
      root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => io.observe(el))
    }
    observe(document)

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.matches('[data-reveal]:not([data-revealed])')) io.observe(node)
          observe(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
