import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type MaskedTextProps = {
  text: string;
  className?: string;
  defaultMasked?: boolean;
  label?: string;
};

export const MaskedText: React.FC<MaskedTextProps> = ({
  text,
  className = "",
  defaultMasked = true,
  label,
}) => {
  const [isMasked, setIsMasked] = useState(defaultMasked);

  if (!text) return null;

  // 텍스트 마스킹 변환 헬퍼
  const getMaskedValue = (val: string) => {
    if (val.length <= 3) return "••••";
    return val.slice(0, 3) + "••••";
  };

  const displayText = isMasked ? getMaskedValue(text) : text;

  return (
    <span className={`masked-text-wrapper ${className}`}>
      {label && <span className="masked-text-label">{label}</span>}
      <span className="masked-text-value">{displayText}</span>
      <button
        type="button"
        onClick={() => setIsMasked(!isMasked)}
        title={isMasked ? "민감 정보 보기" : "민감 정보 가리기"}
        className="masked-toggle-btn"
        aria-label={isMasked ? "민감 정보 보기" : "민감 정보 가리기"}
      >
        {isMasked ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </span>
  );
};
