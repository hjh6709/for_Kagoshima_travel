import { useState, useEffect } from "react";
import { LockKeyhole, Mail, Key, Compass, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { ManageAuthSectionProps } from "../../manageTypes";
import { sendVerificationCode, verifyCode } from "../../../../api/auth";
import { ToastNotification, type ToastMessage, type ToastType } from "../../../../shared/components/ToastNotification";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

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

  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifyingSubmitting, setVerifyingSubmitting] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

  const resetVerification = () => {
    setCodeSent(false);
    setInputCode("");
    setIsCodeVerified(false);
    setVerifyingSubmitting(false);
    setCodeExpiresAt(null);
  };

  useEffect(() => {
    resetVerification();
  }, [authMode]);

  useEffect(() => {
    if (!codeExpiresAt) return;

    const remaining = codeExpiresAt - Date.now();
    if (remaining <= 0) {
      resetVerification();
      return;
    }

    const timeout = window.setTimeout(() => {
      resetVerification();
      setToast({
        id: Date.now().toString(),
        type: "warning",
        title: "인증코드 만료",
        message: "인증코드 유효 시간이 지났습니다. 새 코드를 받아 주세요.",
      });
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [codeExpiresAt]);

  // 회원가입 폼에서 입력한 이메일 주소로 6자리 인증코드를 요청하는 핸들러입니다.
  // api/auth.ts 내 공통화된 통신 함수를 호출하여 주소 중복을 막고, catch 블록에서 세부 에러 응답을 매핑합니다.
  // 사용자가 입력한 6자리 인증 코드가 유효한지 백엔드와 사전 검증하는 핸들러입니다.
  const handleVerifyCodeSubmit = async () => {
    const targetEmail = authEmail;
    const targetCode = inputCode;

    if (!targetCode || targetCode.length < 6) {
      showToast("6자리 인증 코드를 정확히 입력해 주세요.", "warning", "코드 입력 필요");
      return;
    }
    setVerifyingSubmitting(true);
    try {
      await verifyCode(targetEmail, "register", targetCode);
      setIsCodeVerified(true);
      showToast("이메일 소유권 인증이 성공적으로 완료되었습니다!", "success", "인증 완료");
    } catch (err: any) {
      setIsCodeVerified(false);
      showToast(err.message || "인증 코드가 일치하지 않거나 만료되었습니다.", "error", "검증 실패");
    } finally {
      setVerifyingSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    if (!authEmail || !authEmail.includes("@")) {
      showToast("올바른 이메일 주소를 입력하고 코드를 요청해 주세요.", "warning", "입력 오류");
      return;
    }
    setSendSubmitting(true);
    setIsCodeVerified(false);
    try {
      // 가입(register) 목적의 인증코드 발송임을 명시하여 중복 이메일 가입 방지 검증을 활성화합니다.
      await sendVerificationCode(authEmail, "register");

      setCodeSent(true);
      setInputCode("");
      setCodeExpiresAt(Date.now() + 5 * 60 * 1000);
      showToast("입력한 이메일 주소로 인증코드를 보냈습니다. 메일함을 확인해 주세요.", "success", "인증 메일 발송 완료");
    } catch (err: any) {
      if (err.status === 409) {
        showToast("이미 등록된 이메일 주소입니다. 다른 이메일로 가입해 주세요.", "error", "가입 불가");
      } else if (err.status === 404) {
        showToast("인증코드 발송 엔드포인트를 찾을 수 없습니다. (404 Not Found)", "error", "통신 오류");
      } else if (err.status === 405) {
        showToast("허용되지 않은 요청 메서드(Method)입니다. 서버 라우팅 상태를 확인해 주세요. (405 Method Not Allowed)", "error", "라우팅 오류");
      } else if (err.status === 502 || err.status === 504) {
        showToast("서버 게이트웨이가 응답하지 않습니다. 네트워크 연결을 확인하세요.", "error", "네트워크 오류");
      } else {
        showToast(err.message || "인증코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error", "전송 실패");
      }
    } finally {
      setSendSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    if (value !== authEmail && (codeSent || inputCode || isCodeVerified)) {
      resetVerification();
    }
    onAuthEmailChange(value);
  };
  const handleSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    if (authMode === "register") {
      if (!isCodeVerified) {
        e.preventDefault();
        showToast("이메일 인증 코드 검증을 먼저 진행해 주세요.", "warning", "이메일 인증 필요");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordRegex.test(authPassword)) {
        e.preventDefault();
        showToast("비밀번호 규칙(영문 대/소문자, 숫자, 특수문자 조합 8자 이상)을 만족해야 합니다.", "warning", "비밀번호 규칙 미충족");
        return;
      }
    }
    onSubmitAuth(e);
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
        <ForgotPasswordModal
          onClose={() => setIsForgotMode(false)}
          onSuccessToast={(msg) => showToast(msg, "success", "재설정 완료")}
        />
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
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

      <form className="auth-form" onSubmit={handleSubmitForm}>
        <div className="auth-field-label">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label htmlFor="manage-auth-email">이메일 주소</label>
            {isCodeVerified && (
              <span aria-live="polite" style={{ fontSize: "var(--type-label-size)", color: "var(--c-route)", fontWeight: "var(--font-weight-strong)", display: "flex", alignItems: "center", gap: "2px" }}>
                <CheckCircle2 size={12} /> 이메일 인증 완료
              </span>
            )}
          </div>
          <div className="input-with-icon">
            <Mail size={16} className="field-icon" />
            <input
              id="manage-auth-email"
              autoComplete="email"
              inputMode="email"
              readOnly={isCodeVerified}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={authEmail}
              style={isCodeVerified ? { backgroundColor: "var(--c-route-soft)", borderColor: "var(--c-route)" } : undefined}
            />
          </div>
        </div>

        {authMode === "register" && (
          <div className="auth-field-label" style={{ marginTop: "12px" }}>
            <label htmlFor="manage-auth-code">이메일 인증 코드 (6자리)</label>
            <div className="auth-verification-row">
              <input
                id="manage-auth-code"
                aria-describedby={codeSent && !isCodeVerified ? "manage-auth-code-hint" : undefined}
                autoComplete="one-time-code"
                inputMode="numeric"
                name="code"
                readOnly={isCodeVerified}
                onChange={(event) => setInputCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                pattern="[0-9]{6}"
                placeholder="수신된 6자리 코드를 입력하세요"
                required
                type="text"
                maxLength={6}
                value={inputCode}
                style={{ flex: 1 }}
              />
              {!codeSent ? (
                <button
                  aria-busy={sendSubmitting}
                  className="secondary-button"
                  disabled={sendSubmitting}
                  onClick={handleSendCode}
                  type="button"
                  style={{ marginTop: 0, padding: "0 12px", minHeight: "44px", fontSize: "var(--type-supporting-size)" }}
                >
                  {sendSubmitting ? "전송 중" : "인증코드 전송"}
                </button>
              ) : isCodeVerified ? (
                <button
                  className="secondary-button"
                  disabled
                  type="button"
                  style={{
                    marginTop: 0,
                    padding: "0 12px",
                    minHeight: "44px",
                    fontSize: "var(--type-supporting-size)",
                    backgroundColor: "var(--c-route-soft)",
                    color: "var(--c-route)",
                    borderColor: "var(--c-route)",
                  }}
                >
                  인증 완료 ✓
                </button>
              ) : (
                <div className="auth-code-actions">
                  <button
                    aria-busy={verifyingSubmitting}
                    className="primary-button"
                    disabled={verifyingSubmitting || inputCode.length < 6}
                    onClick={handleVerifyCodeSubmit}
                    type="button"
                    style={{ marginTop: 0, padding: "0 12px", minHeight: "44px", fontSize: "var(--type-supporting-size)" }}
                  >
                    {verifyingSubmitting ? "검증 중" : "코드 확인"}
                  </button>
                  <button
                    aria-busy={sendSubmitting}
                    className="secondary-button"
                    disabled={sendSubmitting}
                    onClick={handleSendCode}
                    type="button"
                    title="인증코드 재전송"
                    style={{ marginTop: 0, padding: "0 10px", minHeight: "44px", fontSize: "var(--type-label-size)" }}
                  >
                    재전송
                  </button>
                </div>
              )}
            </div>
            {codeSent && !isCodeVerified && (
              <p className="auth-field-hint" id="manage-auth-code-hint">
                인증코드는 전송 후 5분 동안 유효합니다.
              </p>
            )}
          </div>
        )}
        
        <div className="auth-field-label">
          <label htmlFor="manage-auth-password">비밀번호</label>
          <div className="input-with-icon">
            <Key size={16} className="field-icon" />
            <input
              id="manage-auth-password"
              aria-invalid={
                authMode === "register" && authPassword.length > 0 &&
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(authPassword)
              }
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
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {authMode === "register" && authPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(authPassword) && (
          <p className="form-error" role="alert" style={{ fontSize: "var(--type-label-size)", marginTop: "4px" }}>
            ⚠️ 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.
          </p>
        )}

        {authError && <p className="form-error" role="alert">{authError}</p>}

        <button
          aria-busy={authSubmitting}
          className="primary-button"
          disabled={authSubmitting || (authMode === "register" && !isCodeVerified)}
          type="submit"
          style={{ marginTop: "6px" }}
        >
          <LockKeyhole size={18} />
          {authSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입 완료"}
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", gap: "8px" }}>
        <button
          className="secondary-button auth-switch-button"
          onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
          type="button"
          style={{ marginTop: 0, flex: 1, fontSize: "var(--type-label-size)" }}
        >
          {authMode === "login" ? "회원가입" : "로그인"}
        </button>
        {authMode === "login" && (
          <button
            className="secondary-button auth-switch-button"
            onClick={() => setIsForgotMode(true)}
            type="button"
            style={{ marginTop: 0, flex: 1, fontSize: "var(--type-label-size)", color: "var(--c-muted)" }}
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

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </article>
  );
}
