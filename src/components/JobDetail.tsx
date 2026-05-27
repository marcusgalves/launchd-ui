import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogViewer } from "@/components/LogViewer"
import { formatBytes, formatCpuPercent } from "@/lib/resource-utils"
import type { LaunchdJob, ResourceUsage } from "@/types"
import { getJobDetail, revealInFinder, saveJobMetadata } from "@/lib/invoke"
import { FolderOpen } from "lucide-react"
import { formatCalendarIntervals } from "@/lib/calendar-utils"

type JobDetailProps = {
  plistPath: string | null
  open: boolean
  onClose: () => void
  onEdit: (job: LaunchdJob) => void
  onMetadataSaved: () => Promise<void>
  usageByPid: Record<number, ResourceUsage>
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm font-mono break-all">{value}</dd>
    </div>
  )
}

function parseTags(input: string): string[] {
  const tags: string[] = []
  for (const rawTag of input.split(",")) {
    const tag = rawTag.trim()
    if (!tag || tags.includes(tag)) continue
    tags.push(tag)
  }
  return tags
}

export function JobDetail({
  plistPath,
  open,
  onClose,
  onEdit,
  onMetadataSaved,
  usageByPid,
}: JobDetailProps) {
  const [job, setJob] = useState<LaunchdJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [tagsText, setTagsText] = useState("")
  const [metadataSaving, setMetadataSaving] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  useEffect(() => {
    if (!plistPath || !open) return
    setLoading(true)
    setMetadataError(null)
    getJobDetail(plistPath)
      .then((detail) => {
        setJob(detail)
        setDescription(detail.metadata.description)
        setTagsText(detail.metadata.tags.join(", "))
      })
      .catch(() => setJob(null))
      .finally(() => setLoading(false))
  }, [plistPath, open])

  const handleSaveMetadata = async () => {
    if (!job) return

    setMetadataSaving(true)
    setMetadataError(null)
    try {
      const metadata = await saveJobMetadata(job.plist_path, {
        description,
        tags: parseTags(tagsText),
      })
      setJob({ ...job, metadata })
      setDescription(metadata.description)
      setTagsText(metadata.tags.join(", "))
      await onMetadataSaved()
    } catch (e) {
      setMetadataError(String(e))
    } finally {
      setMetadataSaving(false)
    }
  }
  const usage = job?.pid ? usageByPid[job.pid] : undefined

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[600px] sm:w-[640px] sm:max-w-[640px] overflow-y-auto p-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">
            {job?.label ?? "Loading..."}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="px-4 py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {job && !loading && (
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={job.status === "Running" || job.status === "Loaded" ? "default" : "secondary"}
                className={
                  job.status === "Running" ? "bg-emerald-500" :
                  job.status === "Loaded" ? "bg-blue-500" : ""
                }
              >
                {job.status}
              </Badge>
              {job.pid && (
                <span className="text-xs text-muted-foreground">PID: {job.pid}</span>
              )}
              {job.last_exit_code !== null && job.last_exit_code !== undefined && (
                <span className="text-xs text-muted-foreground">
                  Exit: {job.last_exit_code}
                </span>
              )}
              {job.last_run_at && (
                <span className="text-xs text-muted-foreground">
                  Last run: {new Date(Number(job.last_run_at)).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {job.source === "UserAgent" && (
                <Button size="sm" variant="outline" onClick={() => onEdit(job)}>
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => revealInFinder(job.plist_path)}
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                Reveal
              </Button>
            </div>

            <Separator />

            <Tabs defaultValue="config">
              <TabsList>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-1">
                <dl>
                  <DetailRow label="Label" value={job.plist.label} />
                  <DetailRow label="Program" value={job.plist.program} />
                  {job.plist.program_arguments && job.plist.program_arguments.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 py-1.5">
                      <dt className="text-sm text-muted-foreground">Arguments</dt>
                      <dd className="col-span-2 space-y-0.5">
                        {job.plist.program_arguments.map((arg, i) => (
                          <div key={i} className="text-sm font-mono break-all">
                            <span className="text-muted-foreground mr-1">[{i}]</span>
                            {arg}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {job.plist.run_at_load && (
                    <DetailRow label="Run at Load" value="true" />
                  )}
                  {job.plist.keep_alive && (
                    <DetailRow label="Keep Alive" value="true" />
                  )}
                  <DetailRow
                    label="Interval"
                    value={
                      job.plist.start_interval
                        ? `${job.plist.start_interval}s`
                        : undefined
                    }
                  />
                  <DetailRow
                    label="Working Dir"
                    value={job.plist.working_directory}
                  />
                  <DetailRow label="Stdout" value={job.plist.standard_out_path} />
                  <DetailRow label="Stderr" value={job.plist.standard_error_path} />
                  {job.plist.wake_system && (
                    <DetailRow label="Wake System" value="true" />
                  )}
                  {job.plist.disabled && (
                    <DetailRow label="Disabled" value="true" />
                  )}
                </dl>
                {job.plist.environment_variables &&
                  Object.keys(job.plist.environment_variables).length > 0 && (
                    <>
                      <Separator />
                      <h4 className="text-sm font-medium pt-2">
                        Environment Variables
                      </h4>
                      <dl>
                        {Object.entries(job.plist.environment_variables).map(
                          ([key, value]) => (
                            <DetailRow key={key} label={key} value={value} />
                          )
                        )}
                      </dl>
                    </>
                  )}
                {job.plist.start_calendar_interval &&
                  job.plist.start_calendar_interval.length > 0 && (
                    <>
                      <Separator />
                      <h4 className="text-sm font-medium pt-2">Schedule</h4>
                      <div className="text-sm py-0.5">
                        {formatCalendarIntervals(job.plist.start_calendar_interval)}
                      </div>
                    </>
                  )}
              </TabsContent>

              <TabsContent value="notes">
                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="job-description">Description</Label>
                    <textarea
                      id="job-description"
                      className="min-h-32 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                      placeholder="What this agent does, how to run it safely, operational notes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="job-tags">Tags</Label>
                    <Input
                      id="job-tags"
                      placeholder="backup, daily, critical"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas.
                    </p>
                  </div>

                  {parseTags(tagsText).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {parseTags(tagsText).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {metadataError && (
                    <div className="text-sm text-destructive">{metadataError}</div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveMetadata} disabled={metadataSaving}>
                      {metadataSaving ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources">
                {job.pid ? (
                  <dl>
                    <DetailRow label="PID" value={String(job.pid)} />
                    <DetailRow
                      label="CPU"
                      value={formatCpuPercent(usage?.cpu_percent)}
                    />
                    <DetailRow
                      label="Memory"
                      value={formatBytes(usage?.memory_bytes)}
                    />
                  </dl>
                ) : (
                  <div className="text-sm text-muted-foreground py-4">
                    Resource usage is available when this job has a running PID.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logs">
                <div className="space-y-4">
                  {job.plist.standard_out_path && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Standard Output</h4>
                      <LogViewer logPath={job.plist.standard_out_path} />
                    </div>
                  )}
                  {job.plist.standard_error_path && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Standard Error</h4>
                      <LogViewer logPath={job.plist.standard_error_path} />
                    </div>
                  )}
                  {!job.plist.standard_out_path &&
                    !job.plist.standard_error_path && (
                      <div className="text-sm text-muted-foreground py-4">
                        No log paths configured for this agent
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
