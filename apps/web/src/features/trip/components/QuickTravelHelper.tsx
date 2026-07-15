import { useState, useEffect } from "react";
import { ArrowUpDown, Copy, Maximize2, Languages, X } from "lucide-react";

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
  { korean: "고수 빼주세요", foreign: "不要香菜", pronunciation: "부야오 시앙차이" }, // 중국 식문화를 고려한 맞춤형 문구
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
  const [isForeignToKrw, setIsForeignToKrw] = useState<boolean>(true);

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
  }, [destinationCountry, defaultRate]);

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

  // 현지 생존 회화 문구를 클립보드에 복사해 주는 클립보드 API 연동 함수
  const handleCopyPhrase = (phrase: Phrase, index: number) => {
    navigator.clipboard.writeText(phrase.foreign);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500); // 1.5초 후 복사 알림 툴팁 숨김
  };

  return (
    <div className="quick-helper-container">
      {/* 1. 실시간 오프라인 대응 환율 변환 위젯 */}
      <article className="info-card exchange-widget">
        <h2>실시간 환율 변환기 ({isJapan ? "100엔 기준" : "1위안 기준"})</h2>
        <div className="rate-editor">
          <label>적용 환율: </label>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="rate-input"
          />
          <span>원</span>
        </div>

        <div className="exchange-inputs">
          <div className="input-group">
            <span className="unit-label">{isJapan ? "￥" : "元"} ({currencyUnit})</span>
            <input
              type="number"
              placeholder="0"
              value={foreignVal}
              onChange={(e) => handleForeignChange(e.target.value)}
              className="calc-input"
            />
          </div>

          <div className="swap-icon">
            <ArrowUpDown size={18} />
          </div>

          <div className="input-group">
            <span className="unit-label">₩ (원화)</span>
            <input
              type="text"
              placeholder="0"
              value={krwVal}
              onChange={(e) => handleKrwChange(e.target.value)}
              className="calc-input"
            />
          </div>
        </div>
      </article>

      {/* 2. 현지 서바이벌 회화 및 클립보드/소통 기능 영역 */}
      <article className="info-card translation-widget">
        <div className="title-row">
          <h2>현지 생존 회화 ({isJapan ? "일본어" : "중국어"})</h2>
          <Languages size={20} className="muted" />
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

      {/* 3. 현지인과 원활한 바디랭귀지/소통을 돕는 풀스크린 줌 모달 */}
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
