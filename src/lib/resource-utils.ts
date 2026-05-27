export function formatCpuPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-"
  if (value < 0.05) return "0%"
  return `${value.toFixed(value < 10 ? 1 : 0)}%`
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "-"

  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  if (unitIndex === 0) return `${value} ${units[unitIndex]}`
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`
}
