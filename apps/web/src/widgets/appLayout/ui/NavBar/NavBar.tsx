import { type FC, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Send,
  Clock,
  Clock4,
  Settings,
  Settings2,
  Moon,
  Sun,
} from "lucide-react";

import { cn } from "~/shared/lib";
import {
  Logo,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/shared/ui";

import {
  getStoredTheme,
  applyTheme,
  type Theme,
} from "~/features/toggleTheme";

interface NavBarProps {
  email: string;
}

const navItems = [
  { to: "/", label: "Send", icon: Send },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const NavBar: FC<NavBarProps> = ({ email }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
        <div className="flex-1">
          <NavLink to="/" className="inline-flex">
            <Logo className="text-xl" />
          </NavLink>
        </div>

        {/* Desktop nav */}
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

        <div className="flex flex-1 items-center justify-end gap-3.5">
          <NavLink
            to="/history"
            aria-label="History"
            className="sm:hidden"
          >
            <Clock4 className="size-[19px] text-foreground" />
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Settings menu">
                <Settings2 className="size-[22px] text-foreground sm:hidden" />
                <Avatar className="size-8 hidden sm:flex">
                  <AvatarFallback className="bg-primary/8 text-xs font-bold text-secondary">
                    {email.split("@")[0].slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
