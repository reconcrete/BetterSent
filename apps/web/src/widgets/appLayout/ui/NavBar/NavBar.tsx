import type { FC } from "react";
import { NavLink } from "react-router-dom";
import { Home, Clock, Settings } from "lucide-react";

import { cn } from "~/shared/lib";

import { ThemeToggle } from "~/features/toggleTheme";

import { UserMenu } from "../UserMenu/UserMenu";

interface NavBarProps {
  email: string;
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const NavBar: FC<NavBarProps> = ({ email }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
        <NavLink to="/" className="text-lg font-bold tracking-tight text-foreground">
          Bettersent
        </NavLink>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
};
