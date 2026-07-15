import { useState, useEffect } from "react";
import { ArrowUpDown, Copy, Maximize2, Languages, X } from "lucide-react";

interface QuickTravelHelperProps {
  destinationCountry?: string;
}

interface Phrase {
  korean: string;
  foreign: string;
  pronunciation: string;
}

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

export function QuickTravelHelper({ destinationCountry = "JP" }: QuickTravelHelperProps) {
  const isJapan = destinationCountry === "JP";
  
  // 환율 상태 관리 (기본 고정값)
  const defaultRate = isJapan ? 9.0 : 190.0; // 100엔 = 900원, 1위안 = 190원 기준
  const [exchangeRate, setExchangeRate] = useState<number>(defaultRate);
  const [foreignVal, setForeignVal] = useState<string>("");
  const [krwVal, setKrwVal] = useState<string>("");
  const [isForeignToKrw, setIsForeignToKrw] = useState<boolean>(true);

  // 줌인용 상태 관리
  const [zoomedPhrase, setZoomedPhrase] = useState<Phrase | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const currencyUnit = isJapan ? "엔 (JPY)" : "위안 (CNY)";
  const phrases = isJapan ? JAPANESE_PHRASES : CHINESE_PHRASES;

  // 국가 변경 시 환율 리셋
  useEffect(() => {
    setExchangeRate(defaultRate);
    setForeignVal("");
    setKrwVal("");
  }, [destinationCountry, defaultRate]);

  // 환율 계산 함수
  const handleForeignChange = (val: string) => {
    setForeignVal(val);
    if (!val || isNaN(Number(val))) {
      setKrwVal("");
      return;
    }
    const num = Number(val);
    if (isJapan) {
      // 100엔 단위 계산
      setKrwVal(Math.round((num * exchangeRate) / 100).toLocaleString());
    } else {
      setKrwVal(Math.round(num * exchangeRate).toLocaleString());
    }
  };

  const handleKrwChange = (val: string) => {
    setKrwVal(val);
    const cleaned = val.replace(/,/g, "");
    if (!cleaned || isNaN(Number(cleaned))) {
      setForeignVal("");
      return;
    }
    const num = Number(cleaned);
    if (isJapan) {
      setForeignVal(((num / exchangeRate) * 100).toFixed(0));
    } else {
      setForeignVal((num / exchangeRate).toFixed(1));
    }
  };

  const handleCopyPhrase = (phrase: Phrase, index: number) => {
    navigator.clipboard.writeText(phrase.foreign);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="quick-helper-container">
      {/* 1. 환율 변환 위젯 */}
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

      {/* 2. 생존 회화 퀵 시트 */}
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
                <button
                  className="icon-button"
                  onClick={() => handleCopyPhrase(phrase, idx)}
                  title="텍스트 복사"
                >
                  <Copy size={16} />
                  {copiedIndex === idx && <span className="tooltip">복사됨!</span>}
                </button>
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

      {/* 3. 상대방에게 큰 글씨로 보여주기용 모달 팝업 */}
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
