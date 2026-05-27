import { useState, useEffect, useCallback } from "react"
import type { JobListEntry, JobSource } from "@/types"
import { listJobs } from "@/lib/invoke"

type UseJobsReturn = {
  jobs: JobListEntry[]
  filteredJobs: JobListEntry[]
  availableTags: string[]
  loading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  sourceFilter: JobSource | "All"
  setSourceFilter: (value: JobSource | "All") => void
  selectedTags: string[]
  toggleTagFilter: (tag: string) => void
  clearTagFilters: () => void
  refresh: () => Promise<void>
}

export function useJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<JobListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<JobSource | "All">("All")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listJobs()
      setJobs(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const availableTags = Array.from(
    new Set(jobs.flatMap((job) => job.metadata.tags))
  ).sort((a, b) => a.localeCompare(b))

  const toggleTagFilter = useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((selectedTag) => selectedTag !== tag)
        : [...current, tag]
    )
  }, [])

  const clearTagFilters = useCallback(() => {
    setSelectedTags([])
  }, [])

  const filteredJobs = jobs.filter((job) => {
    const normalizedSearch = search.toLowerCase()
    const matchesSearch =
      search === "" ||
      job.label.toLowerCase().includes(normalizedSearch) ||
      job.metadata.description.toLowerCase().includes(normalizedSearch) ||
      job.metadata.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedSearch)
      )
    const matchesSource =
      sourceFilter === "All" || job.source === sourceFilter
    const matchesTags = selectedTags.every((tag) =>
      job.metadata.tags.includes(tag)
    )
    return matchesSearch && matchesSource && matchesTags
  })

  return {
    jobs,
    filteredJobs,
    availableTags,
    loading,
    error,
    search,
    setSearch,
    sourceFilter,
    setSourceFilter,
    selectedTags,
    toggleTagFilter,
    clearTagFilters,
    refresh,
  }
}
