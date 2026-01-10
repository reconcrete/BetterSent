import { useState } from "react";
import { Link, FileText, LogIn, LogOut, UserPlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Button } from "~/shared/ui";
import { SendContent } from "~/features/sendContent";
import { signIn, signUp, signOut, useSession } from "~/shared/lib";

export const Root = () => {
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSuccess = () => {
    if (activeTab === "url") {
      setUrl("");
    } else {
      setText("");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await signIn.email({ email, password });
        if (error) {
          setAuthError(error.message ?? "Login failed");
        }
      } else {
        const { error } = await signUp.email({ email, password, name });
        if (error) {
          setAuthError(error.message ?? "Sign up failed");
        }
      }
    } catch (error) {
      console.error(error);
      setAuthError("An unexpected error occurred");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-black">Kindle Wrap</h1>
            <p className="text-neutral-500">
              {authMode === "login" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-black">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={authMode === "signup"}
                    className="border-neutral-200 text-black placeholder:text-neutral-400"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-black">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-neutral-200 text-black placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-black">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="border-neutral-200 text-black placeholder:text-neutral-400"
                />
              </div>

              {authError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{authError}</p>}

              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  "Loading..."
                ) : authMode === "login" ? (
                  <>
                    <LogIn className="size-4" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main app if logged in
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Kindle Wrap</h1>
          <p className="text-neutral-500">Send articles and text to your Kindle device</p>
          <p className="text-sm text-neutral-400">
            Signed in as <span className="text-black">{session.user.email}</span>
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "text")}>
            <TabsList className="w-full grid grid-cols-2 bg-neutral-100">
              <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-white">
                <Link className="size-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-white">
                <FileText className="size-4" />
                Plain Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-4">
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border-neutral-200 text-black placeholder:text-neutral-400"
              />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <textarea
                placeholder="Paste your text content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-black placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </TabsContent>
          </Tabs>

          <SendContent type={activeTab} content={activeTab === "url" ? url : text} onSuccess={handleSuccess} />
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={handleSignOut} className="text-neutral-500 hover:text-black">
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
