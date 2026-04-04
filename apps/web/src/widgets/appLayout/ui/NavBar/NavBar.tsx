import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Send, Clock, Settings } from "lucide-react";

import { cn } from "~/shared/lib";
import { Logo } from "~/shared/ui";

import { ThemeToggle } from "~/features/toggleTheme";

import { UserMenu } from "../UserMenu/UserMenu";

interface NavBarProps {
  email: string;
}

const navItems = [
  { to: "/", label: "Send", icon: Send },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const NavBar: FC<NavBarProps> = ({ email }) => {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <NavLink to="/">
            <Logo className="text-xl" />
          </NavLink>

          <nav className="hidden sm:flex items-center gap-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-primary/8 text-secondary dark:text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="size-[15px]" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu email={email} />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sm:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-secondary" : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
