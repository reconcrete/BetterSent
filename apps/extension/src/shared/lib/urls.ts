const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"];

const parse = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const isYoutubeUrl = (url: string): boolean => {
  const parsed = parse(url);
  return !!parsed && YOUTUBE_HOSTS.includes(parsed.hostname);
};

// Returns a short human-readable reason when a URL can't be sent, or null when it can.
export const getUnsendableReason = (url: string | undefined): string | null => {
  if (!url) return "This page can't be sent to your Kindle.";

  const parsed = parse(url);
  if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
    return "Browser pages like this one can't be sent to your Kindle.";
  }

  const isWebStore =
    parsed.hostname === "chromewebstore.google.com" ||
    (parsed.hostname === "chrome.google.com" && parsed.pathname.startsWith("/webstore"));
  if (isWebStore) {
    return "The Chrome Web Store can't be sent to your Kindle.";
  }

  return null;
};
