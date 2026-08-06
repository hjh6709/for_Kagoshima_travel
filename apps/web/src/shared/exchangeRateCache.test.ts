import { beforeEach, describe, expect, it } from "vitest";
import {
  EXCHANGE_RATE_CACHE_MAX_AGE,
  readCachedRate,
  saveCachedRate,
} from "./exchangeRateCache";

// 이 테스트 환경의 전역 localStorage에는 호출 가능한 메서드가 없어서
// (Node의 --localstorage-file 미설정) 매 테스트마다 메모리 저장소를 심어 준다.
function installMemoryStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe("exchangeRateCache", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it("저장한 환율을 그대로 다시 읽는다", () => {
    saveCachedRate("JPY", 928.4);

    expect(readCachedRate("JPY")?.rate).toBe(928.4);
  });

  it("캐시가 없으면 null을 돌려준다", () => {
    expect(readCachedRate("JPY")).toBeNull();
  });

  it("보관 기간이 지난 환율은 무시한다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 928.4, savedAt: Date.now() - EXCHANGE_RATE_CACHE_MAX_AGE - 1 }),
    );

    expect(readCachedRate("JPY")).toBeNull();
  });

  it("값이 손상돼 있으면 예외 대신 null을 돌려준다", () => {
    localStorage.setItem("map-planner:exchange-rate:JPY", "not-json");

    expect(readCachedRate("JPY")).toBeNull();
  });

  it("0 이하의 환율은 유효하지 않은 값으로 본다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 0, savedAt: Date.now() }),
    );

    expect(readCachedRate("JPY")).toBeNull();
  });
});
