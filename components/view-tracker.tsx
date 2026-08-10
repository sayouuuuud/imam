"use client"

import { useEffect } from "react"

type ViewTrackerTable = "sermons" | "articles" | "books" | "lessons" | "media"

interface ViewTrackerProps {
  table: ViewTrackerTable
  id: string
}

/**
 * Fires a single view-count increment per item per browser session.
 *
 * This is a client component so search engine crawlers (which don't execute
 * the POST) never inflate the count, and so the server page itself stays
 * cacheable — it no longer writes to the database on every render.
 */
export function ViewTracker({ table, id }: ViewTrackerProps) {
  useEffect(() => {
    if (!id) return

    const storageKey = `viewed:${table}:${id}`
    if (sessionStorage.getItem(storageKey)) return

    sessionStorage.setItem(storageKey, "1")

    fetch(`/api/views/${table}/${id}`, { method: "POST" }).catch(() => {
      // Non-critical — a failed view increment should never affect the page.
    })
  }, [table, id])

  return null
}
