"use client"

import { Monitor, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import { useEffect, useState } from "react"

export function ModeToggle(btn) {
  const { setTheme, theme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (isMounted)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="fixed bottom-3 left-4 z-50">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="bg-secondary rounded-full border p-2 hover:cursor-pointer"
            >
              <AnimatePresence>
                {theme === "light" ? (
                  <motion.div
                    key="sun"
                    initial={{ opacity: 0, scale: 0, rotate: "180deg" }}
                    animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
                    exit={{ opacity: 0, scale: 0, rotate: "180deg" }}
                  >
                    <MoonIcon className="fill-indigo-200 stroke-gray-700" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ opacity: 0, scale: 0, rotate: "180deg" }}
                    animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
                    exit={{ opacity: 0, scale: 0, rotate: "180deg" }}
                  >
                    <SunIcon className="stroke-amber-200" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  return null
}

/**  Accessible theme toggler for dropdown menu */
export function ThemeSwitch() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenuGroup className="flex items-center space-x-[1px] py-0.5">
      <DropdownMenuItem
        title="Light theme"
        className={cn(
          theme === "light"
            ? "bg-primary hover:bg-primary focus:bg-primary"
            : "hover:bg-primary/70 focus:bg-primary/70",
          "group/light h-5 w-7 rounded-none rounded-l-full p-0 outline-1 transition-colors hover:cursor-pointer",
        )}
        onClick={(e) => {
          e.preventDefault()
          setTheme("light")
        }}
        aria-label="light-theme"
        aria-controls="theme"
      >
        <SunIcon
          className={cn(
            theme === "light"
              ? "text-primary-foreground"
              : "group-hover/light:text-primary-foreground group-focus/light:text-primary-foreground",
            "m-auto transition-colors",
          )}
        />
      </DropdownMenuItem>
      <DropdownMenuItem
        title="System theme"
        className={cn(
          theme === "system"
            ? "bg-primary hover:bg-primary focus:bg-primary"
            : "hover:bg-primary/70 focus:bg-primary/70",
          "group/system h-5 w-7 rounded-none p-0 outline-1 transition-colors hover:cursor-pointer",
        )}
        onClick={(e) => {
          e.preventDefault()
          setTheme("system")
        }}
        aria-label="system-theme"
        aria-controls="theme"
      >
        <Monitor
          className={cn(
            theme === "system"
              ? "text-primary-foreground"
              : "group-hover/system:text-primary-foreground group-focus/system:text-primary-foreground",
            "m-auto transition-colors",
          )}
        />
      </DropdownMenuItem>
      <DropdownMenuItem
        title="Dark theme"
        className={cn(
          theme === "dark"
            ? "bg-primary hover:bg-primary focus:bg-primary"
            : "hover:bg-primary/70 focus:bg-primary/70",
          "group/dark h-5 w-7 rounded-none rounded-r-full p-0 outline-1 transition-colors hover:cursor-pointer",
        )}
        onClick={(e) => {
          e.preventDefault()
          setTheme("dark")
        }}
        aria-label="dark-theme"
        aria-controls="theme"
      >
        <MoonIcon
          className={cn(
            theme === "dark"
              ? "text-primary-foreground"
              : "group-hover/dark:text-primary-foreground group-focus/dark:text-primary-foreground",
            "m-auto transition-colors",
          )}
        />
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}
