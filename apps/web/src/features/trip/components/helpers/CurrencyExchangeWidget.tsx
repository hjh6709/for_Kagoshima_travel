import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpDown, Landmark, RefreshCw } from "lucide-react";
import type { CurrencyConfig } from "../../../../shared/currency";
import { readCachedRate, saveCachedRate } from "../../../../shared/exchangeRateCache";

type RateStatus = "loading" | "live" | "cached" | "manual" | "error";

interface CurrencyExchangeWidgetProps {
  config: CurrencyConfig;
}

const REQUEST_TIMEOUT = 8000;

function foreignToKrw(amount: number, rate: number, rateUnit: number) {
  return Math.round((amount * rate) / rateUnit);
}

function krwToForeign(amount: number, rate: number, rateUnit: number) {
  const converted = (amount * rateUnit) / rate;
  return converted >= 100 ? converted.toFixed(0) : converted.toFixed(2).replace(/\.00$/, "");
}

export function CurrencyExchangeWidget({ config }: CurrencyExchangeWidgetProps) {
  const controllerRef = useRef<AbortController | null>(null);
  const cachedRate = readCachedRate(config.code);
  const [exchangeRate, setExchangeRate] = useState<number | null>(cachedRate?.rate ?? null);
  const [rateInput, setRateInput] = useState(cachedRate ? String(cachedRate.rate) : "");
  const [status, setStatus] = useState<RateStatus>(cachedRate ? "cached" : "loading");
  const [foreignVal, setForeignVal] = useState("");
  const [krwVal, setKrwVal] = useState("");

  const fetchRealtimeRate = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT);
    setStatus("loading");

    try {
      const response = await fetch("https://open.er-api.com/v6/latest/KRW", { signal: controller.signal });
      if (!response.ok) throw new Error("rate-request-failed");
      const data = (await response.json()) as { rates?: Record<string, number> };
      const foreignPerKrw = data.rates?.[config.code];
      if (!Number.isFinite(foreignPerKrw) || !foreignPerKrw || foreignPerKrw <= 0) throw new Error("invalid-rate");

      const nextRate = config.rateUnit / foreignPerKrw;
      setExchangeRate(nextRate);
      setRateInput(String(Number(nextRate.toFixed(2))));
      setStatus("live");
      saveCachedRate(config.code, nextRate);
    } catch {
      if (controller.signal.aborted && !timedOut) return;
      const cached = readCachedRate(config.code);
      if (cached) {
        setExchangeRate(cached.rate);
        setRateInput(String(cached.rate));
        setStatus("cached");
      } else {
        setExchangeRate(null);
        setStatus("error");
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [config.code, config.rateUnit]);

  useEffect(() => {
    const cached = readCachedRate(config.code);
    setExchangeRate(cached?.rate ?? null);
    setRateInput(cached ? String(cached.rate) : "");
    setStatus(cached ? "cached" : "loading");
    setForeignVal("");
    setKrwVal("");
    void fetchRealtimeRate();

    return () => controllerRef.current?.abort();
  }, [config.code, fetchRealtimeRate]);

  const updateKrwValue = (foreignAmount: number, rate = exchangeRate) => {
    if (!rate || foreignAmount <= 0) {
      setKrwVal("");
      return;
    }
    setKrwVal(foreignToKrw(foreignAmount, rate, config.rateUnit).toLocaleString("ko-KR"));
  };

  const handleRateChange = (value: string) => {
    setRateInput(value);
    const nextRate = Number(value);
    if (!Number.isFinite(nextRate) || nextRate <= 0) {
      setExchangeRate(null);
      setKrwVal("");
      setStatus("manual");
      return;
    }
    setExchangeRate(nextRate);
    setStatus("manual");
    updateKrwValue(Number(foreignVal), nextRate);
  };

  const handleForeignChange = (value: string) => {
    setForeignVal(value);
    updateKrwValue(Number(value));
  };

  const handleKrwChange = (value: string) => {
    const rawValue = value.replace(/,/g, "");
    setKrwVal(rawValue);
    const amount = Number(rawValue);
    if (!exchangeRate || !Number.isFinite(amount) || amount <= 0) {
      setForeignVal("");
      return;
    }
    setForeignVal(krwToForeign(amount, exchangeRate, config.rateUnit));
  };

  const handleQuickAdd = (amount: number) => {
    const nextValue = (Number(foreignVal) || 0) + amount;
    setForeignVal(String(nextValue));
    updateKrwValue(nextValue);
  };

  const statusText = {
    loading: "최신 환율 확인 중",
    live: "최신 환율 적용",
    cached: "최근 저장 환율 적용",
    manual: "직접 입력 환율 적용",
    error: "환율을 불러오지 못함",
  }[status];

  return (
    <article className="info-card exchange-widget">
      <header className="travel-tool-title-row">
        <div>
          <Landmark aria-hidden="true" size={20} />
          <div>
            <h2>환율 계산기</h2>
            <p>현지 통화와 원화를 빠르게 비교합니다.</p>
          </div>
        </div>
        <button
          aria-label="최신 환율 다시 조회"
          className="tool-refresh-button"
          disabled={status === "loading"}
          onClick={() => void fetchRealtimeRate()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={status === "loading" ? "spin-icon" : ""} size={15} />
          <span>{status === "loading" ? "조회 중" : "새로고침"}</span>
        </button>
      </header>

      <div className={`exchange-rate-status ${status === "error" ? "error" : ""}`} aria-live="polite">
        <span>{statusText}</span>
        <label>
          <span>{config.rateUnit.toLocaleString("ko-KR")}{config.label} =</span>
          <input
            aria-label={`${config.rateUnit.toLocaleString("ko-KR")}${config.label}의 원화 환율`}
            inputMode="decimal"
            min="0"
            onChange={(event) => handleRateChange(event.target.value)}
            placeholder="직접 입력"
            step="any"
            type="number"
            value={rateInput}
          />
          <b>원</b>
        </label>
      </div>

      {status === "error" && <p className="exchange-error-help">네트워크 연결을 확인하거나 위 환율을 직접 입력하세요.</p>}

      <div className="exchange-fields">
        <div className="exchange-field">
          <label htmlFor={`foreign-${config.code}`}>{config.label} ({config.code})</label>
          <input
            id={`foreign-${config.code}`}
            inputMode="decimal"
            min="0"
            onChange={(event) => handleForeignChange(event.target.value)}
            placeholder="금액 입력"
            step="any"
            type="number"
            value={foreignVal}
          />
          <div className="exchange-quick-actions" aria-label={`${config.label} 빠른 금액 추가`}>
            {config.quickAmounts.map((amount) => (
              <button key={amount} onClick={() => handleQuickAdd(amount)} type="button">
                +{amount.toLocaleString("ko-KR")}
              </button>
            ))}
          </div>
        </div>

        <ArrowUpDown aria-hidden="true" className="exchange-swap-icon" size={18} />

        <div className="exchange-field">
          <label htmlFor={`krw-${config.code}`}>원화 (KRW)</label>
          <input
            id={`krw-${config.code}`}
            inputMode="numeric"
            onChange={(event) => handleKrwChange(event.target.value)}
            placeholder={exchangeRate ? "금액 입력" : "환율을 먼저 입력하세요"}
            type="text"
            value={krwVal}
          />
        </div>
      </div>
    </article>
  );
}
