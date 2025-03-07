"use client"

import { RefreshCw } from "lucide-react"
import { Button, buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import { VariantProps } from "class-variance-authority"

type props = {
  isPending: boolean
  variant?: VariantProps<typeof buttonVariants>
  label?: string
  className?: string
  onClick?: () => void
}

// Submit button with pending state
// Also takes an onClick which prevents default
// Keeps it's original size when pending with the help of grid stacking
export default function SubmitButton({
  isPending,
  variant,
  className,
  label = "Submit",
  onClick,
}: props) {
  return (
    <Button
      onClick={
        onClick
          ? (e) => {
              e.preventDefault()
              onClick()
            }
          : undefined
      }
      type="submit"
      disabled={isPending}
      {...variant}
      className={cn(
        className,
        "grid place-items-center [grid-template-areas:'stack']",
      )}
    >
      <span className={cn(isPending && "invisible", "[grid-area:stack]")}>
        {label}
      </span>
      <RefreshCw
        aria-label="Submitting"
        className={cn(
          isPending ? "visible" : "invisible",
          "size-5 animate-spin transition-opacity [grid-area:stack]",
        )}
      />
    </Button>
  )
}
