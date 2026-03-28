import { cn } from "~/shared/lib";

function Logo({ className }: { className?: string }) {
  return (
    <div
      data-slot="logo"
      className={cn("flex items-baseline text-[2rem] leading-normal select-none", className)}
    >
      <span className="font-display italic text-secondary dark:text-primary">better</span>
      <span className="ml-1 translate-y-[0.25px] font-extrabold text-foreground">sent</span>
    </div>
  );
}

export { Logo };
