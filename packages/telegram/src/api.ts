const API_URL = process.env.API_URL || "http://localhost:8080";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface KindleEmail {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExtractResult {
  markdown: string;
  filename: string;
  savedAt: string;
}

interface SignInResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    token: string;
  };
}

// Helper to make authenticated requests
async function apiRequest<T>(
  path: string,
  options: RequestInit & { cookie?: string } = {}
): Promise<ApiResponse<T>> {
  const { cookie, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (cookie) {
    headers["Cookie"] = cookie;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; cookie?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: (data as { message?: string }).message || "Authentication failed",
      };
    }

    // Extract set-cookie header
    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) {
      return { success: false, error: "No session cookie returned" };
    }

    return { success: true, cookie: setCookie };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Get all Kindle emails for the user
export async function getKindleEmails(
  cookie: string
): Promise<ApiResponse<KindleEmail[]>> {
  return apiRequest<KindleEmail[]>("/kindle", { cookie });
}

// Create a new Kindle email
export async function createKindleEmail(
  cookie: string,
  email: string,
  label?: string
): Promise<ApiResponse<KindleEmail>> {
  return apiRequest<KindleEmail>("/kindle", {
    method: "POST",
    cookie,
    body: JSON.stringify({ email, label }),
  });
}

// Set default Kindle email
export async function setDefaultKindleEmail(
  cookie: string,
  kindleEmailId: string
): Promise<ApiResponse<KindleEmail>> {
  return apiRequest<KindleEmail>(`/kindle/${kindleEmailId}/default`, {
    method: "PATCH",
    cookie,
  });
}

// Extract and send text content
export async function sendText(
  cookie: string,
  textContent: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractResult>> {
  return apiRequest<ExtractResult>("/extract/text", {
    method: "POST",
    cookie,
    body: JSON.stringify({ textContent, kindleEmailId }),
  });
}

// Extract and send URL content
export async function sendUrl(
  cookie: string,
  url: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractResult>> {
  return apiRequest<ExtractResult>("/extract/url", {
    method: "POST",
    cookie,
    body: JSON.stringify({ url, kindleEmailId }),
  });
}

// Check if session is valid
export async function checkSession(cookie: string): Promise<boolean> {
  const response = await apiRequest<{ id: string }>("/user/me", { cookie });
  return response.success;
}
