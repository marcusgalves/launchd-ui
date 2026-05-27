import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { JobList } from "./JobList"
import type { JobListEntry } from "@/types"

const mockJobs: JobListEntry[] = [
  {
    label: "com.example.running",
    pid: 1234,
    last_exit_code: 0,
    plist_path: "/Users/test/Library/LaunchAgents/com.example.running.plist",
    source: "UserAgent",
    status: "Running",
    last_run_at: String(Date.now()),
    metadata: {
      description: "Keeps the example process running.",
      tags: ["example", "critical"],
    },
  },
  {
    label: "com.example.stopped",
    pid: null,
    last_exit_code: 78,
    plist_path: "/Users/test/Library/LaunchAgents/com.example.stopped.plist",
    source: "UserAgent",
    status: "Unloaded",
    last_run_at: null,
    metadata: {
      description: "",
      tags: [],
    },
  },
]

const noop = vi.fn()
const usageByPid = {
  1234: {
    pid: 1234,
    cpu_percent: 2.4,
    memory_bytes: 52_428_800,
  },
}

describe("JobList", () => {
  it("renders loading state", () => {
    render(
      <JobList
        jobs={[]}
        loading={true}
        usageByPid={{}}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("Loading agents...")).toBeInTheDocument()
  })

  it("renders empty state", () => {
    render(
      <JobList
        jobs={[]}
        loading={false}
        usageByPid={{}}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("No agents found")).toBeInTheDocument()
  })

  it("renders job list with labels", () => {
    render(
      <JobList
        jobs={mockJobs}
        loading={false}
        usageByPid={usageByPid}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("com.example.running")).toBeInTheDocument()
    expect(screen.getByText("com.example.stopped")).toBeInTheDocument()
  })

  it("renders metadata summary", () => {
    render(
      <JobList
        jobs={mockJobs}
        loading={false}
        usageByPid={usageByPid}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("Keeps the example process running.")).toBeInTheDocument()
    expect(screen.getByText("example")).toBeInTheDocument()
    expect(screen.getByText("critical")).toBeInTheDocument()
  })

  it("renders resource usage for running jobs", () => {
    render(
      <JobList
        jobs={mockJobs}
        loading={false}
        usageByPid={usageByPid}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("2.4%")).toBeInTheDocument()
    expect(screen.getByText("50 MB")).toBeInTheDocument()
  })

  it("renders status badges", () => {
    render(
      <JobList
        jobs={mockJobs}
        loading={false}
        usageByPid={usageByPid}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("Running")).toBeInTheDocument()
    expect(screen.getByText("Unloaded")).toBeInTheDocument()
  })

  it("renders PID for running job", () => {
    render(
      <JobList
        jobs={mockJobs}
        loading={false}
        usageByPid={usageByPid}
        onStart={noop}
        onStop={noop}
        onRestart={noop}
        onKickstart={noop}
        onDelete={noop}
        onSelect={noop}
        onRevealInFinder={noop}
      />
    )
    expect(screen.getByText("1234")).toBeInTheDocument()
  })
})
