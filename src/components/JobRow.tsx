import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import type { JobListEntry } from "@/types"
import {
  Play,
  Square,
  RotateCw,
  MoreHorizontal,
  Trash2,
  FileText,
  FolderOpen,
  Zap,
} from "lucide-react"
import { formatBytes, formatCpuPercent } from "@/lib/resource-utils"
import type { ResourceUsage } from "@/types"

function formatRelativeTime(epochMillis: string): string {
  const ms = Number(epochMillis)
  if (isNaN(ms)) return "—"
  const diff = Date.now() - ms
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const date = new Date(ms)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

type JobRowProps = {
  job: JobListEntry
  usage?: ResourceUsage
  onStart: (job: JobListEntry) => void
  onStop: (job: JobListEntry) => void
  onRestart: (job: JobListEntry) => void
  onKickstart: (job: JobListEntry) => void
  onDelete: (job: JobListEntry) => void
  onSelect: (job: JobListEntry) => void
  onRevealInFinder: (job: JobListEntry) => void
}

function StatusBadge({ status }: { status: JobListEntry["status"] }) {
  switch (status) {
    case "Running":
      return (
        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
          Running
        </Badge>
      )
    case "Loaded":
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          Loaded
        </Badge>
      )
    case "Unloaded":
      return <Badge variant="secondary">Unloaded</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

function SourceBadge({ source }: { source: JobListEntry["source"] }) {
  switch (source) {
    case "UserAgent":
      return <Badge variant="outline">User</Badge>
    case "SystemAgent":
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-700">
          System
        </Badge>
      )
    case "SystemDaemon":
      return (
        <Badge variant="outline" className="border-purple-300 text-purple-700">
          Daemon
        </Badge>
      )
  }
}

export function JobRow({
  job,
  usage,
  onStart,
  onStop,
  onRestart,
  onKickstart,
  onDelete,
  onSelect,
  onRevealInFinder,
}: JobRowProps) {
  const isUserAgent = job.source === "UserAgent"
  const hasMetadata =
    job.metadata.description.trim().length > 0 || job.metadata.tags.length > 0

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSelect(job)}
    >
      <TableCell className="max-w-0">
        <div className="space-y-1">
          <div className="truncate font-medium">{job.label}</div>
          {hasMetadata && (
            <div className="space-y-1">
              {job.metadata.description && (
                <div className="truncate text-xs text-muted-foreground">
                  {job.metadata.description}
                </div>
              )}
              {job.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.metadata.tags.slice(0, 4).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="max-w-24 truncate px-1.5 py-0 text-[11px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {job.metadata.tags.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{job.metadata.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <SourceBadge source={job.source} />
      </TableCell>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {job.pid ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs tabular-nums">
        {job.pid ? formatCpuPercent(usage?.cpu_percent) : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs tabular-nums">
        {job.pid ? formatBytes(usage?.memory_bytes) : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs tabular-nums">
        {job.last_run_at ? formatRelativeTime(job.last_run_at) : "—"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {job.status === "Running" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onStop(job)}
              disabled={!isUserAgent}
              title={isUserAgent ? "Stop" : "Cannot stop system agents"}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : job.status === "Loaded" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onStop(job)}
              disabled={!isUserAgent}
              title={isUserAgent ? "Unload" : "Cannot unload system agents"}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onStart(job)}
              disabled={!isUserAgent}
              title={isUserAgent ? "Load" : "Cannot load system agents"}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {job.status !== "Unloaded" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRestart(job)}
              disabled={!isUserAgent}
              title={isUserAgent ? "Restart" : "Cannot restart system agents"}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onKickstart(job)}>
                <Zap className="mr-2 h-4 w-4" />
                Test Run
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(job)}>
                <FileText className="mr-2 h-4 w-4" />
                Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRevealInFinder(job)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Reveal in Finder
              </DropdownMenuItem>
              {isUserAgent && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(job)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}
