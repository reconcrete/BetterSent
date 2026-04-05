import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "~/shared/lib"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex items-center relative z-10",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-t-[10px] px-3 py-4 md:px-5 text-[13px] font-medium whitespace-nowrap transition-colors",
        "text-[#747474] border-l border-r border-t border-transparent",
        "data-[state=active]:bg-white data-[state=active]:border-black/6 data-[state=active]:text-foreground",
        "dark:data-[state=active]:bg-white/2 dark:data-[state=active]:border-white/6",
        "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 border rounded-b-[16px] outline-none",
        "px-3.5 pt-3 pb-3.5 md:px-[30px] md:pt-5 md:pb-[30px]",
        "bg-white border-black/6",
        "dark:bg-white/2 dark:border-white/6",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
