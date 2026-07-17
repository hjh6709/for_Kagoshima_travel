import { useState } from "react";
import { LockKeyhole, Mail, Key, Compass, Eye, EyeOff } from "lucide-react";
import type { ManageAuthSectionProps } from "../manageTypes";

// 인증 화면만 분리한다. 로그인/회원가입 요청은 App.tsx가 넘긴 콜백이 처리한다.
export function ManageAuthSection({
  auth,
  authChecked,
  authEmail,
  authError,
  authMode,
  authPassword,
  authSubmitting,
  onAuthEmailChange,
  onAuthModeChange,
  onAuthPasswordChange,
  onSubmitAuth,
}: ManageAuthSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    setForgotError("");
    setTemporaryPassword("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "비밀번호 찾기 요청에 실패했습니다.");
      }
      setTemporaryPassword(data.temporaryPassword);
    } catch (err: any) {
      setForgotError(err.message || "서버 통신 오류가 발생했습니다.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  if (authChecked && auth) {
    return null;
  }

  if (!authChecked) {
    return (
      <article className="info-card auth-card auth-card-premium" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
        <Compass className="auth-hero-icon spin-slow" size={42} />
        <h1 style={{ marginTop: "12px" }}>로그인 확인 중</h1>
        <p className="muted">저장된 로그인 정보를 안전하게 확인하고 있습니다.</p>
      </article>
    );
  }

  if (isForgotMode) {
    return (
      <article className="info-card auth-card auth-card-premium">
        <div className="auth-brand-row">
          <div className="auth-brand-circle">
            <Compass className="auth-hero-icon" size={24} />
          </div>
          <span className="pill subtle">비밀번호 찾기</span>
        </div>
        
        <h1>임시 비밀번호 발급</h1>
        <p className="muted">
          가입된 이메일 주소를 입력하시면 즉시 복사하여 로그인할 수 있는 8자리 임시 비밀번호를 발급해 드립니다.
        </p>

        {!temporaryPassword ? (
          <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
            <label className="auth-field-label">
              <span>이메일 주소</span>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  autoComplete="email"
                  inputMode="email"
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={forgotEmail}
                />
              </div>
            </label>

            {forgotError && <p className="form-error">{forgotError}</p>}

            <button className="primary-button" disabled={forgotSubmitting} type="submit" style={{ marginTop: "12px" }}>
              <LockKeyhole size={18} />
              {forgotSubmitting ? "발급 중..." : "임시 비밀번호 발급"}
            </button>
          </form>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginTop: "12px", textAlign: "center" }}>
            <div style={{ padding: "16px", background: "var(--c-surface)", border: "1px dashed var(--c-green)", borderRadius: "8px" }}>
              <span style={{ display: "block", fontSize: "12px", color: "var(--c-muted)", marginBottom: "4px" }}>발급된 임시 비밀번호</span>
              <strong style={{ fontSize: "20px", letterSpacing: "1px", color: "var(--c-green)" }}>{temporaryPassword}</strong>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                navigator.clipboard.writeText(temporaryPassword);
                alert("임시 비밀번호가 클립보드에 복사되었습니다! 로그인 창에 붙여넣어 접속하세요.");
                setIsForgotMode(false);
                setTemporaryPassword("");
                setForgotEmail("");
              }}
              type="button"
            >
              📋 복사하고 로그인하러 가기
            </button>
          </div>
        )}

        <button
          className="secondary-button auth-switch-button"
          onClick={() => {
            setIsForgotMode(false);
            setTemporaryPassword("");
            setForgotError("");
          }}
          type="button"
          style={{ marginTop: "14px" }}
        >
          로그인 화면으로 돌아가기
        </button>
      </article>
    );
  }

  return (
    <article className="info-card auth-card auth-card-premium">
      <div className="auth-brand-row">
        <div className="auth-brand-circle">
          <Compass className="auth-hero-icon" size={24} />
        </div>
        <span className="pill subtle">여행 관리 계정</span>
      </div>
      
      <h1>{authMode === "login" ? "여행 관리 로그인" : "여행 관리 계정 만들기"}</h1>
      <p className="muted">
        처음 사용하는 경우 계정을 만든 뒤 여행을 생성합니다. 공유 링크를 받은 동반자는 로그인 없이 일정을 읽기 전용으로 바로 확인합니다.
      </p>

      <form className="auth-form" onSubmit={onSubmitAuth}>
        <label className="auth-field-label">
          <span>이메일 주소</span>
          <div className="input-with-icon">
            <Mail size={16} className="field-icon" />
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => onAuthEmailChange(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={authEmail}
            />
          </div>
        </label>
        
        <label className="auth-field-label">
          <span>비밀번호</span>
          <div className="input-with-icon">
            <Key size={16} className="field-icon" />
            <input
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              className="with-password-toggle"
              minLength={8}
              onChange={(event) => onAuthPasswordChange(event.target.value)}
              placeholder="8자 이상 입력"
              required
              type={showPassword ? "text" : "password"}
              value={authPassword}
            />
            <button
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
              tabIndex={-1}
              title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {authError && <p className="form-error">{authError}</p>}

        <button className="primary-button" disabled={authSubmitting} type="submit" style={{ marginTop: "6px" }}>
          <LockKeyhole size={18} />
          {authSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입 완료"}
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", gap: "8px" }}>
        <button
          className="secondary-button auth-switch-button"
          onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
          type="button"
          style={{ marginTop: 0, flex: 1, fontSize: "12px" }}
        >
          {authMode === "login" ? "회원가입" : "로그인"}
        </button>
        {authMode === "login" && (
          <button
            className="secondary-button auth-switch-button"
            onClick={() => setIsForgotMode(true)}
            type="button"
            style={{ marginTop: 0, flex: 1, fontSize: "12px", color: "var(--c-muted)" }}
          >
            비밀번호 분실
          </button>
        )}
      </div>

      {window.location.hostname === "localhost" && (
        <p className="auth-help">
          로컬 개발은 <code>VITE_API_BASE_URL=http://localhost:8080</code> 설정이 필요합니다.
        </p>
      )}
    </article>
  );
}
