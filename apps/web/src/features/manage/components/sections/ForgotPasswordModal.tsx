import { Key, Mail, X } from "lucide-react";
import { useState } from "react";
import { forgotPassword, sendVerificationCode } from "../../../../api/auth";

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export function ForgotPasswordModal({ onClose, onSuccessToast }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [delivered, setDelivered] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus("");
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    setSendingCode(true);
    setError("");
    setStatus("");

    try {
      const response = await sendVerificationCode(normalizedEmail, "forgot");
      setCodeSent(true);
      setDevelopmentCode(window.location.hostname === "localhost" ? response.code : "");
      setStatus("인증코드를 이메일로 보냈습니다. 5분 안에 입력해 주세요.");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "인증코드를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    if (normalizedCode.length !== 6) {
      setError("6자리 인증코드를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await forgotPassword(email.trim(), normalizedCode);
      setDelivered(response.delivered);
      if (response.delivered) {
        onSuccessToast("임시 비밀번호를 이메일로 보냈습니다!");
      } else {
        setTempPassword(response.temporaryPassword);
        onSuccessToast("임시 비밀번호가 성공적으로 발급되었습니다!");
      }
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "임시 비밀번호 발급에 실패했습니다. 코드 및 이메일을 확인해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAndClose = async () => {
    if (!navigator.clipboard || !tempPassword) {
      setError(
        "이 브라우저에서는 자동 복사를 지원하지 않습니다. 임시 비밀번호를 직접 복사해 주세요.",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(tempPassword);
      onSuccessToast("임시 비밀번호를 복사했습니다.");
      onClose();
    } catch {
      setError("임시 비밀번호를 복사하지 못했습니다. 직접 복사한 뒤 로그인해 주세요.");
    }
  };

  return (
    <div className="forgot-password-overlay">
      <section
        aria-describedby="forgot-password-description"
        aria-labelledby="forgot-password-title"
        aria-modal="true"
        className="forgot-password-dialog"
        role="dialog"
      >
        <header className="forgot-password-header">
          <div>
            <span>계정 복구</span>
            <h2 id="forgot-password-title">비밀번호 찾기</h2>
          </div>
          <button
            aria-label="비밀번호 찾기 닫기"
            className="forgot-password-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <p className="forgot-password-description" id="forgot-password-description">
          가입 이메일로 인증코드를 받은 뒤 8자리 임시 비밀번호를 발급하세요.
        </p>

        {error && (
          <p className="form-error forgot-password-error" role="alert">
            {error}
          </p>
        )}

        {delivered ? (
          <div className="forgot-password-result">
            <p className="forgot-password-status" role="status">
              가입하신 이메일로 임시 비밀번호를 보내드렸습니다. 메일함을 확인한 뒤 로그인해 주세요.
            </p>
            <button className="primary-button" onClick={onClose} type="button">
              닫기
            </button>
          </div>
        ) : !tempPassword ? (
          <form className="auth-form forgot-password-form" onSubmit={handleSubmit}>
            <label className="auth-field-label">
              <span>계정 이메일</span>
              <div className="input-with-icon">
                <Mail aria-hidden="true" className="field-icon" size={16} />
                <input
                  autoComplete="email"
                  autoFocus
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCodeSent(false);
                    setDevelopmentCode("");
                    setStatus("");
                  }}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <button
              className="secondary-button forgot-password-send-code"
              disabled={sendingCode}
              onClick={() => void handleSendCode()}
              type="button"
            >
              {sendingCode ? "전송 중" : codeSent ? "인증코드 다시 받기" : "인증코드 받기"}
            </button>

            {status && (
              <p className="forgot-password-status" role="status">
                {status}
              </p>
            )}

            {developmentCode && (
              <p className="forgot-password-development-code">
                개발용 인증코드 <strong>{developmentCode}</strong>
              </p>
            )}

            <label className="auth-field-label">
              <span>6자리 인증코드</span>
              <div className="input-with-icon">
                <Key aria-hidden="true" className="field-icon" size={16} />
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  placeholder="인증코드 6자리"
                  required
                  type="text"
                  value={code}
                />
              </div>
            </label>

            <div className="forgot-password-actions">
              <button className="secondary-button" onClick={onClose} type="button">
                취소
              </button>
              <button
                className="primary-button"
                disabled={submitting || code.length !== 6}
                type="submit"
              >
                {submitting ? "발급 중" : "임시 비밀번호 생성"}
              </button>
            </div>
          </form>
        ) : (
          <div className="forgot-password-result">
            <div className="forgot-password-password">
              <span>새로 발급된 임시 비밀번호</span>
              <strong>{tempPassword}</strong>
            </div>

            <button
              className="primary-button"
              onClick={() => void handleCopyAndClose()}
              type="button"
            >
              임시 비밀번호 복사하고 닫기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
