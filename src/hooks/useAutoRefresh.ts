import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoRefreshOptions {
  intervalSeconds?: number
  enabled?: boolean
}

interface UseAutoRefreshReturn {
  lastRefreshed: Date | null
  refresh: () => void
}

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {},
): UseAutoRefreshReturn {
  const { intervalSeconds = 30, enabled = true } = options
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const callbackRef = useRef(callback)

  callbackRef.current = callback

  const refresh = useCallback(() => {
    callbackRef.current()
    setLastRefreshed(new Date())
  }, [])

  useEffect(() => {
    if (!enabled) return

    const id = setInterval(() => {
      callbackRef.current()
      setLastRefreshed(new Date())
    }, intervalSeconds * 1000)

    return () => clearInterval(id)
  }, [intervalSeconds, enabled])

  return { lastRefreshed, refresh }
}
