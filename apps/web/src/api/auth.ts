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
  // VITE_API_BASE_URL이 생략된 경우, 상대 경로(/api/...) 통신을 보장하기 위해 빈 문자열을 리턴합니다.
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

// 이메일 인증코드 발송 시, 가입(register) 또는 분실(forgot) 목적 구분 파라미터(purpose)를 실어서 보냅니다.
export function sendVerificationCode(email: string, purpose: string) {
  return apiRequest<{ code: string }>("/api/auth/send-verification-code", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
}

// 입력한 이메일과 6자리 인증코드가 일치하는지 백엔드와 사전 대조합니다.
export function verifyCode(email: string, code: string) {
  return apiRequest<{ verified: boolean }>("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function forgotPassword(email: string, code: string) {
  return apiRequest<{ temporaryPassword: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

// 마이페이지에서 본인의 비밀번호를 변경하기 위한 API 호출 헬퍼입니다.
export function changePassword(accessToken: string, currentPassword: string, newPassword: string) {
  return apiRequest<void>("/api/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
