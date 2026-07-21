import React, { useState } from "react";

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
    <span className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
      {label && <span className="text-slate-400 text-xs font-sans mr-0.5">{label}</span>}
      <span className="tracking-wide transition-all duration-200">{displayText}</span>
      <button
        type="button"
        onClick={() => setIsMasked(!isMasked)}
        title={isMasked ? "민감 정보 보기" : "민감 정보 가리기"}
        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors focus:outline-none"
      >
        {isMasked ? (
          /* Eye Icon (가려진 상태에서 클릭 시 보이기) */
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ) : (
          /* EyeOff Icon (보이는 상태에서 클릭 시 가리기) */
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.122-.563c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21f-9 9 0 00-9-9"
            />
          </svg>
        )}
      </button>
    </span>
  );
};
