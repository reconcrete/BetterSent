import * as React from "react"

import { cn } from "~/shared/lib"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex h-[120px] w-full rounded-xl border px-4 py-3.5 text-sm text-foreground resize-none transition-[color,box-shadow] outline-none",
        "bg-black/3 border-black/6",
        "dark:bg-white/4 dark:border-white/6",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
