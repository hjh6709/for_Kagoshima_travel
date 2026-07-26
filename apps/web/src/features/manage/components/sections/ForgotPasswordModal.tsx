import { useState } from "react";
import { Mail, Key } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await forgotPassword(email, code);
      setTempPassword(res.temporaryPassword);
      onSuccessToast("임시 비밀번호가 성공적으로 발급되었습니다!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "임시 비밀번호 발급에 실패했습니다. 코드 및 이메일을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAndClose = () => {
    if (tempPassword) {
      navigator.clipboard?.writeText(tempPassword);
      onSuccessToast("임시 비밀번호가 클립보드에 복사되었습니다!");
    }
    onClose();
  };

  return (
    <div
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
        style={{
          background: "var(--c-surface)",
          padding: "28px 24px",
          borderRadius: "20px",
          maxWidth: "380px",
          width: "100%",
          display: "grid",
          gap: "16px",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--c-text)" }}>
            비밀번호 찾기 (임시 발급)
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--c-muted)" }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "var(--c-muted)", margin: 0, lineHeight: 1.5 }}>
          가입 시 사용한 이메일과 수신한 6자리 인증코드를 입력하시면 8자리 임시 비밀번호를 발급해 드립니다.
        </p>

        {!tempPassword ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
            <label className="auth-field-label">
              <span>계정 이메일</span>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="auth-field-label">
              <span>6자리 인증코드</span>
              <div className="input-with-icon">
                <Key size={16} className="field-icon" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="인증코드 6자리"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </label>

            {error && <p className="form-error" style={{ fontSize: "12px", margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                style={{ flex: 1, marginTop: 0 }}
              >
                취소
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
                style={{ flex: 1, marginTop: 0 }}
              >
                {submitting ? "발급 중" : "임시 비밀번호 생성"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: "14px", textAlign: "center" }}>
            <div style={{ background: "var(--c-route-soft)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "12px", color: "var(--c-muted)", display: "block" }}>새로 발급된 임시 비밀번호</span>
              <strong style={{ fontSize: "24px", color: "var(--c-route)", letterSpacing: "2px" }}>{tempPassword}</strong>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleCopyAndClose}
              style={{ marginTop: 0 }}
            >
              📋 복사하고 창 닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
