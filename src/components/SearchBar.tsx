import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { JobSource } from "@/types"
import { Search, X } from "lucide-react"

type SearchBarProps = {
  search: string
  onSearchChange: (value: string) => void
  sourceFilter: JobSource | "All"
  onSourceFilterChange: (value: JobSource | "All") => void
  availableTags: string[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  onTagClear: () => void
}

const sourceOptions: Array<{ value: JobSource | "All"; label: string }> = [
  { value: "All", label: "All" },
  { value: "UserAgent", label: "User" },
  { value: "SystemAgent", label: "System" },
  { value: "SystemDaemon", label: "Daemon" },
]

export function SearchBar({
  search,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  availableTags,
  selectedTags,
  onTagToggle,
  onTagClear,
}: SearchBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search labels, descriptions, tags..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {sourceOptions.map((option) => (
            <Button
              key={option.value}
              variant={sourceFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSourceFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {availableTags.map((tag) => {
            const selected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Badge variant={selected ? "default" : "outline"}>
                  {tag}
                </Badge>
              </button>
            )
          })}
          {selectedTags.length > 0 && (
            <Button variant="ghost" size="xs" onClick={onTagClear}>
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
