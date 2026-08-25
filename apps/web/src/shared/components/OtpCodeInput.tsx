import { useRef } from "react";

type OtpCodeInputProps = {
  id: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaDescribedBy?: string;
};

// 인증코드를 자리마다 분리된 박스로 입력받는다. 카카오·토스처럼 진행 상황이
// 눈에 보이고, 자리마다 자동으로 다음 칸으로 넘어간다.
// 값은 항상 부모가 쓰는 6자리 문자열 하나로 오간다 — 박스 개수는 표현 방식일 뿐,
// 상위 상태(inputCode)는 바뀌지 않는다.
export function OtpCodeInput({
  id,
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
  ariaDescribedBy,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const commit = (nextValue: string) => {
    onChange(nextValue);
    if (nextValue.length === length) {
      onComplete?.(nextValue);
    }
  };

  const focusBox = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      // 지우기: 이 칸만 비운다.
      commit(digits.map((d, i) => (i === index ? "" : d)).join(""));
      return;
    }

    // 붙여넣기나 빠른 입력으로 여러 자리가 한 번에 들어올 수 있다 — 현재 칸부터 채운다.
    const next = digits.slice();
    let cursor = index;
    for (const char of digitsOnly) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    commit(next.join(""));

    const nextEmptyOrLast = Math.min(cursor, length - 1);
    focusBox(nextEmptyOrLast);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      commit(digits.map((d, i) => (i === index - 1 ? "" : d)).join(""));
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  return (
    <div aria-describedby={ariaDescribedBy} className="otp-code-input" role="group">
      {digits.map((digit, index) => (
        <input
          aria-label={`인증코드 ${index + 1}번째 자리`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          id={index === 0 ? id : undefined}
          inputMode="numeric"
          key={index}
          onChange={(event) => handleChange(index, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => handleKeyDown(index, event)}
          pattern="[0-9]"
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          value={digit}
        />
      ))}
    </div>
  );
}
