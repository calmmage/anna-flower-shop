"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Only show the toggle after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true)
    // Initialize theme state based on document class
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")

    // Set up a listener for theme changes from other components
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("literature-shop-theme")
      if (currentTheme === "dark" || currentTheme === "light") {
        setTheme(currentTheme)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"

    // Update the document class
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)

    // Save to localStorage
    localStorage.setItem("literature-shop-theme", newTheme)

    // Update state
    setTheme(newTheme)

    // Dispatch storage event for other components
    window.dispatchEvent(new Event("storage"))

    console.log("Theme toggled to:", newTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-700" />}
    </button>
  )
}

