import { useState } from "react";
import { Copy, Languages, Maximize2, X } from "lucide-react";
import { CHINESE_PHRASES, JAPANESE_PHRASES, type Phrase } from "../../../../data/survivalPhrases";

interface SurvivalPhraseWidgetProps {
  destinationCountry?: string;
}

export function SurvivalPhraseWidget({ destinationCountry = "JP" }: SurvivalPhraseWidgetProps) {
  const isJapan = destinationCountry === "JP";
  const phrases = isJapan ? JAPANESE_PHRASES : CHINESE_PHRASES;

  const [zoomedPhrase, setZoomedPhrase] = useState<Phrase | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyPhrase = async (phrase: Phrase, index: number) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(phrase.foreign);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // 복사 실패 처리
    }
  };

  return (
    <>
      <article className="info-card translation-widget" style={{ display: "grid", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Languages size={20} style={{ color: "var(--c-accent-emerald)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--c-text)" }}>
              {isJapan ? "일본어 현지 생존 회화" : "중국어 현지 생존 회화"}
            </h2>
          </div>
          <span className="pill subtle" style={{ fontSize: "11px" }}>
            {isJapan ? "일어/발음" : "중어/발음"}
          </span>
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          {phrases.map((phrase, idx) => (
            <div
              key={phrase.korean}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "rgba(15, 23, 42, 0.03)",
                borderRadius: "10px",
                border: "1px solid rgba(15, 23, 42, 0.05)",
              }}
            >
              <div style={{ display: "grid", gap: "2px" }}>
                <span style={{ fontSize: "12px", color: "var(--c-muted)", fontWeight: 600 }}>
                  {phrase.korean}
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--c-text)" }}>
                  {phrase.foreign}
                </span>
                <span style={{ fontSize: "12px", color: "var(--c-accent-emerald)", fontWeight: 700 }}>
                  [{phrase.pronunciation}]
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setZoomedPhrase(phrase)}
                  aria-label={`${phrase.korean} 크게 보기`}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid rgba(15, 23, 42, 0.1)",
                    background: "var(--c-surface)",
                    color: "var(--c-text)",
                    cursor: "pointer",
                  }}
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyPhrase(phrase, idx)}
                  aria-label={`${phrase.korean} 번역어 복사`}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid rgba(15, 23, 42, 0.1)",
                    background: copiedIndex === idx ? "var(--c-accent-emerald)" : "var(--c-surface)",
                    color: copiedIndex === idx ? "#ffffff" : "var(--c-text)",
                    cursor: "pointer",
                  }}
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* 크게 보기 줌인 모달 */}
      {zoomedPhrase && (
        <div
          className="zoom-modal-backdrop"
          onClick={() => setZoomedPhrase(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="zoom-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--c-surface)",
              padding: "32px 24px",
              borderRadius: "24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              display: "grid",
              gap: "16px",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.3)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setZoomedPhrase(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "var(--c-muted)",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            <span style={{ fontSize: "14px", color: "var(--c-muted)", fontWeight: 700 }}>
              {zoomedPhrase.korean}
            </span>

            <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2, wordBreak: "keep-all" }}>
              {zoomedPhrase.foreign}
            </div>

            <div style={{ fontSize: "18px", color: "var(--c-accent-emerald)", fontWeight: 800 }}>
              [{zoomedPhrase.pronunciation}]
            </div>

            <p style={{ fontSize: "12px", color: "var(--c-muted)", margin: 0 }}>
              현지 상인이나 택시 기사님께 이 화면을 직접 보여주세요!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
