import { useState, useEffect } from "react";
import { ArrowUpDown, Landmark, RefreshCw } from "lucide-react";

interface CurrencyExchangeWidgetProps {
  destinationCountry?: string;
}

function foreignToKrw(amount: number, rate: number, isJapan: boolean) {
  return Math.round(isJapan ? (amount * rate) / 100 : amount * rate);
}

function krwToForeign(amount: number, rate: number, isJapan: boolean) {
  return isJapan ? ((amount / rate) * 100).toFixed(0) : (amount / rate).toFixed(1);
}

export function CurrencyExchangeWidget({ destinationCountry = "JP" }: CurrencyExchangeWidgetProps) {
  const isJapan = destinationCountry === "JP";
  
  // 환율 상태 관리 (기본 디폴트 기준 환율 설정)
  const defaultRate = isJapan ? 900 : 190;
  const [exchangeRate, setExchangeRate] = useState<number>(defaultRate);
  const [foreignVal, setForeignVal] = useState<string>("");
  const [krwVal, setKrwVal] = useState<string>("");

  // 실시간 API 고시 환율 상태
  const [apiRate, setApiRate] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  const currencyUnit = isJapan ? "엔 (JPY)" : "위안 (CNY)";

  useEffect(() => {
    setExchangeRate(defaultRate);
    setForeignVal("");
    setKrwVal("");
    setApiRate(null);
    fetchRealtimeRate();
  }, [destinationCountry, defaultRate]);

  const fetchRealtimeRate = async () => {
    setApiLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/KRW");
      if (!res.ok) throw new Error("API status error");
      const data = await res.json();
      
      if (data && data.rates) {
        if (isJapan) {
          if (!Number.isFinite(data.rates.JPY) || data.rates.JPY <= 0) throw new Error("Invalid JPY rate");
          const rateJpy = 1 / data.rates.JPY;
          const rate100Jpy = Math.round(rateJpy * 100);
          setApiRate(rate100Jpy);
          setExchangeRate(rate100Jpy);
        } else {
          if (!Number.isFinite(data.rates.CNY) || data.rates.CNY <= 0) throw new Error("Invalid CNY rate");
          const rateCny = Math.round(1 / data.rates.CNY);
          setApiRate(rateCny);
          setExchangeRate(rateCny);
        }
      }
    } catch {
      // API 실패 시 기본환율 유지
    } finally {
      setApiLoading(false);
    }
  };

  const handleForeignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForeignVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && exchangeRate > 0) {
      setKrwVal(foreignToKrw(num, exchangeRate, isJapan).toLocaleString("ko-KR"));
    } else {
      setKrwVal("");
    }
  };

  const handleKrwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/,/g, "");
    setKrwVal(rawVal);
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 0 && exchangeRate > 0) {
      setForeignVal(krwToForeign(num, exchangeRate, isJapan));
    } else {
      setForeignVal("");
    }
  };

  const handleQuickAddForeign = (add: number) => {
    const current = parseFloat(foreignVal) || 0;
    const next = current + add;
    setForeignVal(next.toString());
    if (exchangeRate > 0) {
      setKrwVal(foreignToKrw(next, exchangeRate, isJapan).toLocaleString("ko-KR"));
    }
  };

  return (
    <article className="info-card exchange-widget" style={{ padding: "20px", display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Landmark size={20} style={{ color: "var(--c-route)" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--c-text)" }}>
            실시간 환율 계산기
          </h2>
        </div>
        <button
          onClick={fetchRealtimeRate}
          disabled={apiLoading}
          type="button"
          aria-label="환율 새로고침"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--c-muted)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          <RefreshCw size={13} className={apiLoading ? "spin-icon" : ""} />
          {apiLoading ? "조회중" : "새로고침"}
        </button>
      </div>

      <div style={{ background: "var(--c-surface-cool)", padding: "12px 14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
        <span style={{ color: "var(--c-muted)" }}>
          적용 환율: <strong>{isJapan ? "100엔 =" : "1위안 ="} {exchangeRate.toLocaleString()} 원</strong>
        </span>
        {apiRate && (
          <span className="pill subtle" style={{ fontSize: "11px", background: "var(--c-route-soft)", color: "var(--c-route)" }}>
            실시간 고시
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "12px", color: "var(--c-muted)", fontWeight: 700, marginBottom: "4px", display: "block" }}>
            {currencyUnit}
          </label>
          <input
            type="number"
            placeholder={isJapan ? "예: 1000" : "예: 100"}
            value={foreignVal}
            onChange={handleForeignChange}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--c-text)",
              background: "var(--c-surface)",
            }}
          />
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {[isJapan ? 100 : 10, isJapan ? 500 : 50, isJapan ? 1000 : 100, isJapan ? 5000 : 500].map((add) => (
              <button
                key={add}
                type="button"
                onClick={() => handleQuickAddForeign(add)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--c-surface)",
                  color: "var(--c-text)",
                }}
              >
                +{add.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", color: "var(--c-muted)", margin: "-4px 0" }}>
          <ArrowUpDown size={16} />
        </div>

        <div>
          <label style={{ fontSize: "12px", color: "var(--c-muted)", fontWeight: 700, marginBottom: "4px", display: "block" }}>
            원화 (KRW)
          </label>
          <input
            type="text"
            placeholder="예: 9,000"
            value={krwVal}
            onChange={handleKrwChange}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--c-text)",
              background: "var(--c-surface)",
            }}
          />
        </div>
      </div>
    </article>
  );
}
