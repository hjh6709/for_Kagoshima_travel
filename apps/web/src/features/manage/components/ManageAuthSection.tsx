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

      <button
        className="secondary-button auth-switch-button"
        onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
        type="button"
        style={{ marginTop: "12px" }}
      >
        {authMode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
      </button>

      {window.location.hostname === "localhost" && (
        <p className="auth-help">
          로컬 개발은 <code>VITE_API_BASE_URL=http://localhost:8080</code> 설정이 필요합니다.
        </p>
      )}
    </article>
  );
}
