"use client"

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react"

type SidebarStateContextValue = {
  openItems: Set<string>
  toggle: (title: string) => void
  collapseAll: () => void
}

export const SidebarStateContext = createContext<SidebarStateContextValue>({
  openItems: new Set(),
  toggle: () => {},
  collapseAll: () => {},
})

export function useSidebarStateProvider() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(["Dashboard"]))
  const [loaded, setLoaded] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load saved state on mount
  useEffect(() => {
    fetch("/api/sidebar-state")
      .then((res) => res.json())
      .then((data) => {
        if (data.openItems?.length) {
          setOpenItems(new Set(data.openItems))
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Debounced save to API
  const save = useCallback((items: Set<string>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      fetch("/api/sidebar-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openItems: Array.from(items) }),
      }).catch(() => {})
    }, 500)
  }, [])

  const toggle = useCallback((title: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      save(next)
      return next
    })
  }, [save])

  const collapseAll = useCallback(() => {
    const empty = new Set<string>()
    setOpenItems(empty)
    save(empty)
  }, [save])

  return { openItems, toggle, collapseAll, loaded }
}

export function useSidebarState() {
  return useContext(SidebarStateContext)
}
