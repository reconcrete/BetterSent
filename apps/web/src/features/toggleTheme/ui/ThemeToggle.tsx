import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "~/shared/ui";

import { type Theme, getStoredTheme, applyTheme } from "../lib";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
};
