import { cn } from "~/shared/lib";

function Logo({ className }: { className?: string }) {
  return (
    <div
      data-slot="logo"
      className={cn("flex items-center text-[2rem] leading-normal", className)}
    >
      <span className="font-display italic text-primary">better</span>
      <span className="font-extrabold text-foreground">sent</span>
    </div>
  );
}

export { Logo };
