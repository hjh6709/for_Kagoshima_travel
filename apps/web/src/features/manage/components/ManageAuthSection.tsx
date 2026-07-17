import { useState, useEffect } from "react";
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

  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationPopup, setVerificationPopup] = useState("");

  const regenerateCaptcha = () => {
    const valA = Math.floor(Math.random() * 15) + 1;
    const valB = Math.floor(Math.random() * 9) + 1;
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      setCaptchaQuestion(`${valA}+${valB}`);
    } else {
      setCaptchaQuestion(`${valA + valB}-${valA}`);
    }
  };

  useEffect(() => {
    if (authMode === "register") {
      regenerateCaptcha();
    } else {
      setVerificationPopup("");
      setCodeSent(false);
    }
  }, [authMode]);

  const handleSendCode = async () => {
    if (!authEmail || !authEmail.includes("@")) {
      alert("올바른 이메일 주소를 입력하고 코드를 요청해 주세요.");
      return;
    }
    setSendSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "인증코드 전송에 실패했습니다.");
      }
      setVerificationPopup(data.code);
      setCodeSent(true);
    } catch (err: any) {
      alert(err.message || "인증코드 발송 중 오류가 발생했습니다.");
    } finally {
      setSendSubmitting(false);
    }
  };

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
    <>
      {verificationPopup && (
        <div style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "var(--c-surface)",
          border: "1px dashed var(--c-green)",
          borderRadius: "12px",
          padding: "14px 20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          width: "90%",
          maxWidth: "360px"
        }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--c-green)", marginBottom: "4px" }}>
            📨 가상 이메일 수신 시뮬레이터
          </span>
          <p style={{ fontSize: "13px", margin: 0, color: "var(--c-text)" }}>
            인증 코드가 발급되었습니다: <strong style={{ fontSize: "16px", color: "var(--c-green)" }}>{verificationPopup}</strong>
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(verificationPopup);
              alert("인증코드가 클립보드에 복사되었습니다!");
              setVerificationPopup("");
            }}
            type="button"
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "6px",
              fontSize: "11px",
              background: "var(--c-green)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            📋 인증코드 복사 및 팝업 닫기
          </button>
        </div>
      )}
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

        {authMode === "register" && (
          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>이메일 인증 코드 (6자리)</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                name="verificationCode"
                placeholder="시뮬레이터 코드를 입력하세요"
                required
                type="text"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <button
                className="secondary-button"
                disabled={sendSubmitting}
                onClick={handleSendCode}
                type="button"
                style={{ marginTop: 0, padding: "0 12px", whiteSpace: "nowrap", height: "42px", fontSize: "12px" }}
              >
                {sendSubmitting ? "전송 중" : codeSent ? "재전송" : "인증코드 전송"}
              </button>
            </div>
          </label>
        )}
        
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

        {authMode === "register" && (
          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>사람 인증 (수학 퀴즈 방지)</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap", color: "var(--c-green)" }}>
                {captchaQuestion} =
              </span>
              <input
                name="captchaAnswer"
                placeholder="정답 입력"
                required
                type="number"
                style={{ flex: 1 }}
              />
              <input type="hidden" name="captchaKey" value={captchaQuestion} />
              <button
                className="secondary-button"
                onClick={regenerateCaptcha}
                type="button"
                title="새 캡차 문제 생성"
                style={{ marginTop: 0, padding: "0 10px", height: "42px" }}
              >
                🔄
              </button>
            </div>
          </label>
        )}

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
    </>
  );
}
