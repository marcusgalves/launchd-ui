import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Theme = "light" | "dark" | "system"

const storageKey = "launchd-ui-theme"
const darkSchemeQuery = "(prefers-color-scheme: dark)"

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const stored = window.localStorage.getItem(storageKey)
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }

  return "system"
}

function getResolvedTheme(theme: Theme): Exclude<Theme, "system"> {
  if (theme !== "system") return theme

  return window.matchMedia(darkSchemeQuery).matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme)
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.style.colorScheme = resolved
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(storageKey, theme)
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia(darkSchemeQuery)
    const handleChange = () => applyTheme("system")
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const resolvedTheme = getResolvedTheme(theme)
  const label =
    theme === "system"
      ? "Using system theme"
      : resolvedTheme === "dark"
        ? "Using dark mode"
        : "Using light mode"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={label}
          aria-label={label}
        >
          {theme === "system" ? (
            <Monitor className="h-4 w-4" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
