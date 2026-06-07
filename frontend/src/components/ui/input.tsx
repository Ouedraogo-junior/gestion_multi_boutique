import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-[#1C1C1C]",
        "placeholder:text-gray-400",
        "transition-colors outline-none",
        "focus:border-[#1A7A4A] focus:ring-2 focus:ring-[#1A7A4A]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }