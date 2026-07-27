import { useEffect, useRef, useState } from "react";
import { Copy, Languages, Maximize2, X } from "lucide-react";
import { CHINESE_PHRASES, JAPANESE_PHRASES, type Phrase } from "../../../../data/survivalPhrases";

interface SurvivalPhraseWidgetProps {
  destinationCountry?: string;
}

export function SurvivalPhraseWidget({ destinationCountry }: SurvivalPhraseWidgetProps) {
  const isJapan = destinationCountry === "JP";
  const phrases = isJapan ? JAPANESE_PHRASES : CHINESE_PHRASES;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [zoomedPhrase, setZoomedPhrase] = useState<Phrase | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!zoomedPhrase) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomedPhrase(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedPhrase]);

  const handleCopyPhrase = async (phrase: Phrase) => {
    if (!navigator.clipboard) {
      setCopyMessage("이 브라우저에서는 복사를 지원하지 않습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(phrase.foreign);
      setCopyMessage(`${phrase.korean} 문장을 복사했습니다.`);
    } catch {
      setCopyMessage("문장을 복사하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <>
      <article className="info-card translation-widget">
        <header className="travel-tool-title-row">
          <div>
            <Languages aria-hidden="true" size={20} />
            <div>
              <h2>{isJapan ? "일본어 생존 회화" : "중국어 생존 회화"}</h2>
              <p>크게 열어 현지에서 바로 보여줄 수 있습니다.</p>
            </div>
          </div>
          <span className="tool-language-label">{isJapan ? "일본어" : "중국어"}</span>
        </header>

        <div className="phrase-grid">
          {phrases.map((phrase) => (
            <div className="phrase-row" key={phrase.korean}>
              <div className="phrase-content">
                <span className="korean-text">{phrase.korean}</span>
                <span className="foreign-text" lang={isJapan ? "ja" : "zh-CN"}>{phrase.foreign}</span>
                <span className="pronun-text">[{phrase.pronunciation}]</span>
              </div>

              <div className="phrase-actions">
                <button
                  aria-label={`${phrase.korean} 문장 크게 보기`}
                  className="icon-button"
                  onClick={() => setZoomedPhrase(phrase)}
                  type="button"
                >
                  <Maximize2 aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label={`${phrase.korean} 번역 문장 복사`}
                  className="icon-button"
                  onClick={() => void handleCopyPhrase(phrase)}
                  type="button"
                >
                  <Copy aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="visually-hidden" aria-live="polite">{copyMessage}</p>
      </article>

      {zoomedPhrase && (
        <div className="modal-overlay" onClick={() => setZoomedPhrase(null)}>
          <div
            aria-labelledby="phrase-dialog-title"
            aria-modal="true"
            className="zoom-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="큰 문장 닫기"
              className="close-btn"
              onClick={() => setZoomedPhrase(null)}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" size={21} />
            </button>

            <div className="zoom-modal-content">
              <span className="zoom-korean" id="phrase-dialog-title">{zoomedPhrase.korean}</span>
              <strong className="zoom-foreign" lang={isJapan ? "ja" : "zh-CN"}>{zoomedPhrase.foreign}</strong>
              <span className="zoom-pronun">[{zoomedPhrase.pronunciation}]</span>
              <p className="zoom-instruction">현지 직원이나 기사에게 이 화면을 보여주세요.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
