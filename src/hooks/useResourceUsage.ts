import { useCallback, useEffect, useMemo, useState } from "react"
import { getResourceUsage } from "@/lib/invoke"
import type { JobListEntry, ResourceUsage } from "@/types"

type UseResourceUsageReturn = {
  usageByPid: Record<number, ResourceUsage>
  error: string | null
  refresh: () => Promise<void>
}

export function useResourceUsage(
  jobs: JobListEntry[],
  intervalMs = 5000
): UseResourceUsageReturn {
  const pids = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((job) => job.pid)
            .filter((pid): pid is number => pid !== null)
        )
      ).sort((a, b) => a - b),
    [jobs]
  )
  const pidKey = pids.join(",")
  const [usageByPid, setUsageByPid] = useState<Record<number, ResourceUsage>>({})
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (pids.length === 0) {
      setUsageByPid({})
      setError(null)
      return
    }

    try {
      const usage = await getResourceUsage(pids)
      setUsageByPid(
        Object.fromEntries(
          Object.entries(usage).map(([pid, value]) => [Number(pid), value])
        )
      )
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [pidKey])

  useEffect(() => {
    void refresh()

    if (pids.length === 0) return

    const id = window.setInterval(() => {
      void refresh()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, pidKey, refresh])

  return { usageByPid, error, refresh }
}
