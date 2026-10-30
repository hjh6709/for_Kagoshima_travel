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
const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let pendingMutationCount = 0;

function getApiBaseURL() {
  // VITE_API_BASE_URL이 생략된 경우, 상대 경로(/api/...) 통신을 보장하기 위해 빈 문자열을 리턴합니다.
  return apiBaseURL;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isMutation = mutationMethods.has(
    options.method?.toUpperCase() ?? "GET",
  );
  if (isMutation) pendingMutationCount += 1;

  try {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (headers.get("Authorization")?.trim() === "Bearer") {
      headers.delete("Authorization");
    }
    const response = await fetch(`${getApiBaseURL()}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });

    // 본문이 비어 있으면(204 등) 빈 객체로 둔다. 본문이 있는데 JSON이 아니면
    // (예: API 주소 설정이 빠져 개발 서버의 index.html을 받은 경우) 성공 상태라도
    // 성공으로 넘기지 않는다 — 예전엔 {}로 삼켜서 호출부가 존재하지 않는
    // 필드(auth.user.email 등)를 읽다가 화면 전체가 크래시했다.
    const text = await response.text().catch(() => "");
    let body: { error?: unknown } = {};
    if (text.trim() !== "") {
      try {
        body = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new ApiError("서버 응답을 해석하지 못했습니다. 잠시 후 다시 시도해주세요.", response.status);
        }
      }
    }
    if (!response.ok) {
      const message =
        typeof body?.error === "string"
          ? body.error
          : "요청을 처리하지 못했습니다.";
      throw new ApiError(message, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new ApiError(
      "서버에 연결할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.",
    );
  } finally {
    if (isMutation) pendingMutationCount -= 1;
  }
}

export function hasPendingApiMutation() {
  return pendingMutationCount > 0;
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, code?: string) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, code }),
  });
}

export function getCurrentUser(accessToken = "") {
  return apiRequest<AuthSessionResponse>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

// 이메일 인증코드 발송 시, 가입(register) 또는 분실(forgot) 목적 구분 파라미터(purpose)를 실어서 보냅니다.
export function sendVerificationCode(email: string, purpose: string) {
  return apiRequest<{ code: string }>("/api/auth/send-verification-code", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
}

// 입력한 이메일과 6자리 인증코드가 일치하는지 백엔드와 사전 대조합니다.
export function verifyCode(
  email: string,
  purpose: "register" | "forgot",
  code: string,
) {
  return apiRequest<{ verified: boolean }>("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, purpose, code }),
  });
}

export function forgotPassword(email: string, code: string) {
  return apiRequest<{ temporaryPassword: string; delivered: boolean }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email, code }),
    },
  );
}

// 마이페이지에서 본인의 비밀번호를 변경하기 위한 API 호출 헬퍼입니다.
export function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
) {
  return apiRequest<AuthResponse>("/api/auth/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function deleteAccount(accessToken: string, currentPassword: string) {
  return apiRequest<void>("/api/auth/account", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword }),
  });
}
