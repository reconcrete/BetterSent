export type Theme = "light" | "dark";

export const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};
