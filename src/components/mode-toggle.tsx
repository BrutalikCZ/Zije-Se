"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-9 h-9" /> // Placeholder to prevent layout shift
        )
    }

    const toggleTheme = () => {
        if (resolvedTheme === "dark") {
            setTheme("light")
        } else {
            setTheme("dark")
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className="cursor-pointer flex items-center justify-center p-2 transition-colors text-white dark:text-black opacity-60 hover:opacity-100"
            aria-label="Toggle theme"
        >
            {/* Sun icon for Light Mode (hidden in Dark Mode) */}
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

            {/* Moon icon for Dark Mode (hidden in Light Mode) */}
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
    )
}
