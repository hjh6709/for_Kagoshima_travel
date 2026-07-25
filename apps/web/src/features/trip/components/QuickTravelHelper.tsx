import { useState, useEffect } from "react";
import { ArrowUpDown, Copy, Maximize2, Languages, X, RefreshCw, Landmark } from "lucide-react";

/**
 * QuickTravelHelperProps: 컴포넌트 입력 프로퍼티
 * destinationCountry: 목적지 국가 코드 (기본값 'JP')
 */
interface QuickTravelHelperProps {
  destinationCountry?: string;
}

/**
 * Phrase: 서바이벌 번역 회화 단위 구조체
 */
interface Phrase {
  korean: string;        // 한국어 본래 문장
  foreign: string;       // 현지 번역어 (일어/중국어 한자)
  pronunciation: string; // 한글 발음 표기법 (현지 소통 가독성 지원)
}

// 일본 여행 시 유용한 퀵 서바이벌 9개 회화 리스트
const JAPANESE_PHRASES: Phrase[] = [
  { korean: "안녕하세요", foreign: "こんにちは", pronunciation: "콘니치와" },
  { korean: "감사합니다", foreign: "ありがとうございます", pronunciation: "아리가토고자이마스" },
  { korean: "실례합니다 / 저기요", foreign: "すみません", pronunciation: "스미마센" },
  { korean: "이것은 얼마입니까?", foreign: "これはいくらですか？", pronunciation: "코레와 이쿠라데스카?" },
  { korean: "이거 주세요", foreign: "これください", pronunciation: "코레 쿠다사이" },
  { korean: "화장실은 어디입니까?", foreign: "お手洗いはどこですか？", pronunciation: "오테아라이와 도코데스카?" },
  { korean: "카드 결제 가능한가요?", foreign: "カードは使えますか？", pronunciation: "카-도와 츠카에마스카?" },
  { korean: "한국어 메뉴판 있나요?", foreign: "韓国語のメニューはありますか？", pronunciation: "칸코쿠고노 메뉴-와 아리마스카?" },
  { korean: "도와주세요 (긴급)", foreign: "助けてください", pronunciation: "타스케테 쿠다사이" },
];

// 중국 여행 시 유용한 퀵 서바이벌 9개 회화 리스트 (여정 상황 맞춤형)
const CHINESE_PHRASES: Phrase[] = [
  { korean: "안녕하세요", foreign: "你好", pronunciation: "니하오" },
  { korean: "감사합니다", foreign: "谢谢", pronunciation: "시에시에" },
  { korean: "실례합니다 / 저기요", foreign: "打扰一下 / 那个", pronunciation: "다라오 이시아 / 네이거" },
  { korean: "이것은 얼마입니까?", foreign: "这个多少钱？", pronunciation: "쩌거 뚜오샤오 치엔?" },
  { korean: "이거 주세요", foreign: "要这个", pronunciation: "야오 쩌거" },
  { korean: "화장실은 어디입니까?", foreign: "洗手间在哪里？", pronunciation: "시쇼우지엔 짜이 나리?" },
  { korean: "카드 결제 가능한가요?", foreign: "可以刷卡吗？", pronunciation: "커이 슈아카 마?" },
  { korean: "고수 빼주세요", foreign: "不要香菜", pronunciation: "부야오 시앙차이" },
  { korean: "도와주세요 (긴급)", foreign: "请帮帮我", pronunciation: "칭 방방 워" },
];

/**
 * QuickTravelHelper 컴포넌트
 * 목적지 국가(일본/중국)에 맞춰 실시간 환율 계산 폼과 현지 생존 회화 편의 도구를 제공합니다.
 */
export function QuickTravelHelper({ destinationCountry = "JP" }: QuickTravelHelperProps) {
  const isJapan = destinationCountry === "JP";
  
  // 환율 상태 관리 (데이터베이스가 오프라인일 때도 정상 가동하기 위한 기본 디폴트 기준 환율 설정)
  const defaultRate = isJapan ? 9.0 : 190.0; // 100엔 = 900원, 1위안 = 190원 기준 초기값
  const [exchangeRate, setExchangeRate] = useState<number>(defaultRate);
  const [foreignVal, setForeignVal] = useState<string>("");
  const [krwVal, setKrwVal] = useState<string>("");

  // 실시간 API 고시 환율 상태
  const [apiRate, setApiRate] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // 크게 보여주기 줌인(Magnify) 모달 상태
  const [zoomedPhrase, setZoomedPhrase] = useState<Phrase | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const currencyUnit = isJapan ? "엔 (JPY)" : "위안 (CNY)";
  const phrases = isJapan ? JAPANESE_PHRASES : CHINESE_PHRASES;

  // 목적지 국가가 바뀔 경우 기존 입력값 및 디폴트 환율을 리셋하여 혼선을 예방합니다.
  useEffect(() => {
    setExchangeRate(defaultRate);
    setForeignVal("");
    setKrwVal("");
    setApiRate(null);
    fetchRealtimeRate();
  }, [destinationCountry, defaultRate]);

  // 실시간 환율 API 패치 (ER-API)
  const fetchRealtimeRate = async () => {
    setApiLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/KRW");
      if (!res.ok) throw new Error("API status error");
      const data = await res.json();
      
      if (data && data.rates) {
        if (isJapan) {
          // 100엔 기준 역산 환율 (1 / rates.JPY * 100)
          const rateJpy = 1 / data.rates.JPY;
          setApiRate(Math.round(rateJpy * 100 * 100) / 100);
        } else {
          // 1위안 기준 역산 환율 (1 / rates.CNY)
          const rateCny = 1 / data.rates.CNY;
          setApiRate(Math.round(rateCny * 100) / 100);
        }
      }
    } catch (err) {
      console.warn("실시간 환율 API 호출 실패. 디폴트 환율로 가동합니다:", err);
    } finally {
      setApiLoading(false);
    }
  };

  // [환율 변환 수식 로직]: 외화 ➡️ 원화 변환
  const handleForeignChange = (val: string) => {
    setForeignVal(val);
    if (!val || isNaN(Number(val))) {
      setKrwVal("");
      return;
    }
    const num = Number(val);
    if (isJapan) {
      // 엔화는 관례상 100엔 단위를 기준으로 환산합니다. (예: 1000엔 * 9.0 = 9000원)
      setKrwVal(Math.round((num * exchangeRate) / 100).toLocaleString());
    } else {
      // 위안화는 1위안 단위를 기준으로 정직하게 1:1 환산합니다. (예: 10위안 * 190 = 1900원)
      setKrwVal(Math.round(num * exchangeRate).toLocaleString());
    }
  };

  // [환율 변환 수식 로직]: 원화 ➡️ 외화 변환
  const handleKrwChange = (val: string) => {
    setKrwVal(val);
    const cleaned = val.replace(/,/g, ""); // 금액 세 자릿수 컴마 기호 제거
    if (!cleaned || isNaN(Number(cleaned))) {
      setForeignVal("");
      return;
    }
    const num = Number(cleaned);
    if (isJapan) {
      // 원화에서 엔화로 변환 시 100엔 단위 수식을 역산 적용합니다.
      setForeignVal(((num / exchangeRate) * 100).toFixed(0));
    } else {
      // 위안화 변환 시 소수점 한 자리까지 노출하여 직관성을 높입니다.
      setForeignVal((num / exchangeRate).toFixed(1));
    }
  };

  // 간편 가산 터치 패드 작동 헬퍼
  const handleQuickAdd = (amount: number) => {
    const current = Number(foreignVal) || 0;
    const nextVal = (current + amount).toString();
    handleForeignChange(nextVal);
  };

  // 계산기 초기화
  const handleReset = () => {
    setForeignVal("");
    setKrwVal("");
  };

  // 현지 생존 회화 문구를 클립보드에 복사해 주는 클립보드 API 연동 함수
  const handleCopyPhrase = (phrase: Phrase, index: number) => {
    navigator.clipboard.writeText(phrase.foreign);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500); // 1.5초 후 복사 알림 툴팁 숨김
  };

  return (
    <div className="quick-helper-container">
      {/* 1. 간편 환율 계산기 위젯 개편 */}
      <article className="info-card exchange-widget" style={{ padding: "20px", display: "grid", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
            간편 환율 계산기 ({isJapan ? "100엔 기준" : "1위안 기준"})
          </h2>
          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "10px" }}>
            {isJapan ? "100円 = 900원" : "1元 = 190원"} 기준
          </span>
        </div>

        <div className="rate-editor" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <label style={{ color: "var(--c-muted)" }}>적용 환율 설정:</label>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => {
              const val = Number(e.target.value);
              setExchangeRate(val);
              // 환율 수치가 바뀔 때 기존 외화 대비 한화 금액 동시 갱신
              if (foreignVal) {
                if (isJapan) {
                  setKrwVal(Math.round((Number(foreignVal) * val) / 100).toLocaleString());
                } else {
                  setKrwVal(Math.round(Number(foreignVal) * val).toLocaleString());
                }
              }
            }}
            className="rate-input"
            style={{ width: "80px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.02)", color: "#ffffff", textAlign: "center" }}
          />
          <span>원</span>
          <button 
            type="button" 
            onClick={fetchRealtimeRate} 
            disabled={apiLoading}
            style={{ border: 0, background: "transparent", color: "var(--c-muted)", display: "flex", alignItems: "center", cursor: "pointer", marginLeft: "auto" }}
            title="실시간 환율 가져오기"
          >
            <RefreshCw size={14} className={apiLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* 외화 및 원화 입력폼 */}
        <div className="exchange-inputs" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="input-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span className="unit-label" style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>
              {isJapan ? "￥" : "元"} ({currencyUnit})
            </span>
            <input
              type="number"
              placeholder="0"
              value={foreignVal}
              onChange={(e) => handleForeignChange(e.target.value)}
              className="calc-input"
              style={{ width: "100%", padding: "12px", fontSize: "18px", fontWeight: 700, borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)", color: "#ffffff" }}
            />
          </div>

          <div className="swap-icon" style={{ display: "flex", justifyContent: "center", color: "var(--c-muted)" }}>
            <ArrowUpDown size={16} />
          </div>

          <div className="input-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span className="unit-label" style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>
              ₩ (원화 KRW)
            </span>
            <input
              type="text"
              placeholder="0"
              value={krwVal}
              onChange={(e) => handleKrwChange(e.target.value)}
              className="calc-input"
              style={{ width: "100%", padding: "12px", fontSize: "18px", fontWeight: 700, borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)", color: "#ffffff" }}
            />
          </div>
        </div>

        {/* 간편 터치 덧셈 버튼 패드 수식 */}
        <div style={{ display: "grid", gap: "8px", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>간편 금액 합산 패드</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {isJapan ? (
              <>
                <button type="button" onClick={() => handleQuickAdd(1000)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+1,000円</button>
                <button type="button" onClick={() => handleQuickAdd(5000)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+5,000円</button>
                <button type="button" onClick={() => handleQuickAdd(10000)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+10,000円</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => handleQuickAdd(10)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+10元</button>
                <button type="button" onClick={() => handleQuickAdd(50)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+50元</button>
                <button type="button" onClick={() => handleQuickAdd(100)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+100元</button>
                <button type="button" onClick={() => handleQuickAdd(500)} className="secondary-button compact-button" style={{ flex: 1, fontSize: "11px", padding: "8px 0" }}>+500元</button>
              </>
            )}
            <button 
              type="button" 
              onClick={handleReset} 
              className="danger-button compact-button" 
              style={{ flex: 1, fontSize: "11px", padding: "8px 0", background: "rgba(166,75,69,0.15)", color: "#f43f5e", borderColor: "rgba(166,75,69,0.3)" }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* 실시간 고시 환율 대조 피드 노출 */}
        {apiRate !== null && (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 12px", marginTop: "4px" }}>
            <Landmark size={13} style={{ color: "var(--c-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--c-muted)" }}>
              실시간 고시 환율 피드 대조:
            </span>
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
              {isJapan ? `100엔 = ${apiRate}원` : `1위안 = ${apiRate}원`}
            </span>
          </div>
        )}
      </article>

      {/* 2. 현지 서바이벌 회화 및 클립보드/소통 기능 영역 */}
      <article className="info-card translation-widget" style={{ display: "grid", gap: "14px" }}>
        <div className="title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
            현지 생존 회화 ({isJapan ? "일본어" : "중국어"})
          </h2>
          <Languages size={20} className="muted" />
        </div>

        {/* 실시간 외부 번역기 즉시 연동 단추 패널 */}
        <div style={{ display: "flex", gap: "8px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>번역기 바로가기</span>
            <p style={{ fontSize: "11px", color: "var(--c-muted)", margin: 0 }}>탭 한 번으로 번역 페이지로 신속히 이동합니다.</p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <a
              href={isJapan ? "https://papago.naver.com/?sk=ko&tk=ja" : "https://papago.naver.com/?sk=ko&tk=zh-CN"}
              target="_blank"
              rel="noreferrer"
              className="primary-button compact-button"
              style={{ padding: "8px 12px", fontSize: "12px", background: "#00c73c", borderColor: "#00c73c", color: "#ffffff", fontWeight: 700, borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
            >
              Papago
            </a>
            <a
              href={isJapan ? "https://translate.google.com/?sl=ko&tl=ja" : "https://translate.google.com/?sl=ko&tl=zh-CN"}
              target="_blank"
              rel="noreferrer"
              className="secondary-button compact-button"
              style={{ padding: "8px 12px", fontSize: "12px", background: "#4285f4", borderColor: "#4285f4", color: "#ffffff", fontWeight: 700, borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
            >
              Google
            </a>
          </div>
        </div>

        <div className="phrase-grid">
          {phrases.map((phrase, idx) => (
            <div className="phrase-row" key={idx}>
              <div className="phrase-content">
                <span className="korean-text">{phrase.korean}</span>
                <span className="foreign-text">{phrase.foreign}</span>
                <span className="pronun-text">[{phrase.pronunciation}]</span>
              </div>
              <div className="phrase-actions">
                {/* 텍스트 복사 버튼 */}
                <button
                  className="icon-button"
                  onClick={() => handleCopyPhrase(phrase, idx)}
                  title="텍스트 복사"
                >
                  <Copy size={16} />
                  {copiedIndex === idx && <span className="tooltip">복사됨!</span>}
                </button>
                {/* 대화형 스마트폰 화면 줌 모달 실행 버튼 */}
                <button
                  className="icon-button"
                  onClick={() => setZoomedPhrase(phrase)}
                  title="현지인에게 크게 보여주기"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* 3. 풀스크린 줌 모달 */}
      {zoomedPhrase && (
        <div className="modal-overlay" onClick={() => setZoomedPhrase(null)}>
          <div className="zoom-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setZoomedPhrase(null)}>
              <X size={24} />
            </button>
            <div className="zoom-modal-content">
              <span className="zoom-korean">{zoomedPhrase.korean}</span>
              <span className="zoom-foreign">{zoomedPhrase.foreign}</span>
              <span className="zoom-pronun">[{zoomedPhrase.pronunciation}]</span>
            </div>
            <p className="zoom-instruction">현지 직원에게 스마트폰 화면을 직접 보여주세요!</p>
          </div>
        </div>
      )}
    </div>
  );
}
