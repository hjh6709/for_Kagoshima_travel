export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AuthSessionResponse = {
  user: AuthUser;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

function getApiBaseURL() {
  if (!apiBaseURL) {
    throw new ApiError("API 주소가 설정되지 않았습니다. VITE_API_BASE_URL을 확인해주세요.");
  }
  return apiBaseURL;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseURL()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : "요청을 처리하지 못했습니다.";
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  password: string,
  code?: string,
  captchaAnswer?: number,
  captchaKey?: string
) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, code, captchaAnswer, captchaKey }),
  });
}

export function getCurrentUser(accessToken: string) {
  return apiRequest<AuthSessionResponse>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function sendVerificationCode(email: string) {
  return apiRequest<{ code: string }>("/api/auth/send-verification-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email: string, code: string) {
  return apiRequest<{ temporaryPassword: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}
