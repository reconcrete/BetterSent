import * as React from "react"

import { cn } from "~/shared/lib"

function Input({
  className,
  type,
  icon,
  ...props
}: React.ComponentProps<"input"> & {
  icon?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex h-[50px] w-full items-center gap-2 rounded-xl border px-4 py-3.5 transition-[color,box-shadow]",
        "bg-black/3 border-black/6",
        "dark:bg-white/4 dark:border-white/6",
        "has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-focus-visible:ring-[3px]",
        "has-disabled:pointer-events-none has-disabled:opacity-50",
        "has-[:aria-invalid]:ring-destructive/20 dark:has-[:aria-invalid]:ring-destructive/40 has-[:aria-invalid]:border-destructive",
        className
      )}
    >
      {icon && (
        <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
      )}
      <input
        type={type}
        data-slot="input"
        className="w-full min-w-0 bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  )
}

export { Input }
