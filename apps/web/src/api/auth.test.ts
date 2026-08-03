import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, hasPendingApiMutation } from "./auth";

describe("apiRequest mutation tracking", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("변경 요청이 끝날 때까지 PWA 갱신을 막을 수 있도록 상태를 노출한다", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    const request = apiRequest("/api/trips/checklists/item", { method: "PATCH" });

    expect(hasPendingApiMutation()).toBe(true);

    resolveFetch?.(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await request;

    expect(hasPendingApiMutation()).toBe(false);
  });

  it("브라우저 인증은 쿠키를 포함하고 빈 Bearer 헤더는 보내지 않는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "user-1", email: "user@example.com" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/auth/me", {
      headers: { Authorization: "Bearer " },
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
    expect(new Headers(options.headers).has("Authorization")).toBe(false);
  });
});
