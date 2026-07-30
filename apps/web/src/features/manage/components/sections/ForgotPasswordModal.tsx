import { Key, Mail, X } from "lucide-react";
import { useState } from "react";
import { forgotPassword } from "../../../../api/auth";

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export function ForgotPasswordModal({ onClose, onSuccessToast }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await forgotPassword(email, code);
      setTempPassword(response.temporaryPassword);
      onSuccessToast("임시 비밀번호가 성공적으로 발급되었습니다!");
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

  const handleCopyAndClose = () => {
    if (tempPassword) {
      void navigator.clipboard?.writeText(tempPassword);
      onSuccessToast("임시 비밀번호가 클립보드에 복사되었습니다!");
    }
    onClose();
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
          가입 시 사용한 이메일과 수신한 6자리 인증코드를 입력하시면 8자리 임시 비밀번호를 발급해 드립니다.
        </p>

        {!tempPassword ? (
          <form className="auth-form forgot-password-form" onSubmit={handleSubmit}>
            <label className="auth-field-label">
              <span>계정 이메일</span>
              <div className="input-with-icon">
                <Mail aria-hidden="true" className="field-icon" size={16} />
                <input
                  autoComplete="email"
                  autoFocus
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <label className="auth-field-label">
              <span>6자리 인증코드</span>
              <div className="input-with-icon">
                <Key aria-hidden="true" className="field-icon" size={16} />
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="인증코드 6자리"
                  required
                  type="text"
                  value={code}
                />
              </div>
            </label>

            {error && <p className="form-error forgot-password-error">{error}</p>}

            <div className="forgot-password-actions">
              <button className="secondary-button" onClick={onClose} type="button">
                취소
              </button>
              <button className="primary-button" disabled={submitting} type="submit">
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

            <button className="primary-button" onClick={handleCopyAndClose} type="button">
              임시 비밀번호 복사하고 닫기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
