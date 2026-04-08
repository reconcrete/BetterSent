import { useEffect, useState, type FC } from "react";
import { Tablet, User, CreditCard, LogOut, Eye, EyeOff, Sun, Moon, Palette, FlaskConical } from "lucide-react";

import { cn, signOut, useSession, useAnalytics } from "~/shared/lib";
import { type Theme, getStoredTheme, applyTheme } from "~/features/toggleTheme";

import { KindleDeviceManager } from "~/widgets/kindleDeviceManager";
import { SubscriptionManager } from "~/widgets/subscriptionManager";
import { TestSend } from "~/widgets/testSend";

type Section = "kindle" | "account" | "subscription" | "appearance" | "test";

const sidebarLinks = [
  { id: "kindle" as const, label: "Kindle Devices", icon: Tablet },
  { id: "account" as const, label: "Account", icon: User },
  { id: "subscription" as const, label: "Subscription", icon: CreditCard },
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "test" as const, label: "Test Send", icon: FlaskConical },
];

const sectionMeta: Record<Section, { title: string; description: string }> = {
  kindle: {
    title: "Kindle Devices",
    description: "Add and manage your Kindle email addresses",
  },
  account: {
    title: "Account",
    description: "Your account information",
  },
  subscription: {
    title: "Subscription",
    description: "Manage your subscription plan",
  },
  appearance: {
    title: "Appearance",
    description: "Choose your preferred theme",
  },
  test: {
    title: "Test Send",
    description: "Send a test EPUB to verify your Kindle setup",
  },
};

export const Settings: FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(
    () => (sessionStorage.getItem("settings-tab") as Section) || "kindle",
  );
  const [showEmail, setShowEmail] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const { data: session } = useSession();
  const analytics = useAnalytics();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const selectTheme = (next: Theme) => {
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  const selectSection = (section: Section) => {
    setActiveSection(section);
    sessionStorage.setItem("settings-tab", section);
  };

  const handleSignOut = async () => {
    analytics.reset();
    await signOut();
  };

  const { title, description } = sectionMeta[activeSection];

  return (
    <div className="mx-auto max-w-[880px] pt-6">
      {/* Mobile section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-4 md:hidden">
        {sidebarLinks.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selectSection(id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
              activeSection === id
                ? "bg-primary/8 font-medium text-secondary dark:text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-[200px] shrink-0 flex-col gap-3.5 md:flex">
          <p className="pl-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground/70">
            Settings
          </p>
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => selectSection(id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeSection === id
                    ? "bg-primary/8 font-medium text-secondary dark:text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-border/60 pt-3.5">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-1">
            <h1 className="text-[22px] font-bold leading-snug text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {activeSection === "kindle" && <KindleDeviceManager />}

          {activeSection === "account" && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Your Account
              </p>
              <div className="rounded-xl border bg-white px-5 py-4 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <button
                    onClick={() => setShowEmail((v) => !v)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={showEmail ? "Hide email" : "Show email"}
                    aria-label={showEmail ? "Hide email" : "Show email"}
                  >
                    {showEmail ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                    {showEmail ? "Hide" : "Show"}
                  </button>
                </div>
                <p
                  className={cn(
                    "text-[13px] text-muted-foreground transition-[filter]",
                    !showEmail && "blur-[3px] select-none",
                  )}
                >
                  {session?.user.email}
                </p>
              </div>
            </div>
          )}

          {activeSection === "subscription" && <SubscriptionManager />}

          {activeSection === "appearance" && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Theme
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => selectTheme("light")}
                  className={cn(
                    "rounded-xl border bg-white p-4 text-left transition-colors dark:bg-white/5",
                    theme === "light"
                      ? "border-secondary ring-1 ring-secondary/30 dark:border-primary dark:ring-primary/30"
                      : "hover:border-border/80",
                  )}
                >
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
                    <Sun className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Light</p>
                  <p className="text-xs text-muted-foreground">
                    Clean and bright
                  </p>
                </button>
                <button
                  onClick={() => selectTheme("dark")}
                  className={cn(
                    "rounded-xl border bg-white p-4 text-left transition-colors dark:bg-white/5",
                    theme === "dark"
                      ? "border-secondary ring-1 ring-secondary/30 dark:border-primary dark:ring-primary/30"
                      : "hover:border-border/80",
                  )}
                >
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                    <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Dark</p>
                  <p className="text-xs text-muted-foreground">
                    Easy on the eyes
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeSection === "test" && <TestSend />}

          {/* Mobile sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 pt-2 text-sm text-destructive md:hidden"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
