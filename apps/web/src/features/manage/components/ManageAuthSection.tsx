import { useState, useEffect } from "react";
import { LockKeyhole, Mail, Key, Compass, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { ManageAuthSectionProps } from "../manageTypes";
import { sendVerificationCode, forgotPassword, verifyCode } from "../../../api/auth";
import { ToastNotification, type ToastMessage, type ToastType } from "../../../shared/components/ToastNotification";

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
  const [inputCode, setInputCode] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifyingSubmitting, setVerifyingSubmitting] = useState(false);
  const [verificationPopup, setVerificationPopup] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

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

  // 회원가입 폼에서 입력한 이메일 주소로 6자리 가상/실제 인증코드를 요청하는 핸들러입니다.
  // api/auth.ts 내 공통화된 통신 함수를 호출하여 주소 중복을 막고, catch 블록에서 세부 에러 응답을 매핑합니다.
  // 사용자가 입력한 6자리 인증 코드가 유효한지 백엔드와 사전 검증하는 핸들러입니다.
  const handleVerifyCodeSubmit = async () => {
    const targetEmail = isForgotMode ? forgotEmail : authEmail;
    const targetCode = isForgotMode ? forgotCode : inputCode;

    if (!targetCode || targetCode.length < 6) {
      showToast("6자리 인증 코드를 정확히 입력해 주세요.", "warning", "코드 입력 필요");
      return;
    }
    setVerifyingSubmitting(true);
    try {
      await verifyCode(targetEmail, targetCode);
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
      const data = await sendVerificationCode(authEmail, "register");
      
      setCodeSent(true);
      if (data.code) {
        setVerificationPopup(data.code);
      } else {
        setVerificationPopup("");
        showToast("기재하신 이메일 주소로 인증 메일이 실제로 전송되었습니다. 메일함을 확인해 주세요.", "success", "인증 메일 발송 완료");
      }
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

  const [forgotCode, setForgotCode] = useState("");

  // 비밀번호 찾기(임시 비번 발급) 진행 전, 사용자의 이메일 소유권을 확인하기 위해 인증코드를 요청하는 핸들러입니다.
  const handleSendForgotCode = async () => {
    if (!forgotEmail || !forgotEmail.includes("@")) {
      showToast("올바른 이메일 주소를 입력하고 코드를 요청해 주세요.", "warning", "입력 오류");
      return;
    }
    setSendSubmitting(true);
    try {
      // 비밀번호 재설정(forgot) 목적의 인증코드 발송임을 명시하여 미등록 이메일 발송 낭비를 차단합니다.
      const data = await sendVerificationCode(forgotEmail, "forgot");
      
      if (data.code) {
        setVerificationPopup(data.code);
        setCodeSent(true);
      } else {
        setVerificationPopup("");
        setCodeSent(false);
        showToast("기재하신 이메일 주소로 비밀번호 찾기 인증 메일이 실제로 전송되었습니다. 메일함을 확인해 주세요.", "success", "비밀번호 찾기 메일 발송");
      }
    } catch (err: any) {
      if (err.status === 400 || err.status === 404) {
        showToast("가입되어 있지 않은 이메일 주소입니다. 가입 정보를 확인해 주세요.", "error", "계정 미존재");
      } else if (err.status === 405) {
        showToast("요청이 거절되었습니다. API 설정을 체크해 주세요. (405 Method Not Allowed)", "error", "요청 거절");
      } else if (err.status === 502 || err.status === 504) {
        showToast("네트워크 통신망 일시 오류입니다. 잠시 후 재전송을 시도하세요.", "error", "네트워크 오류");
      } else {
        showToast(err.message || "인증코드 발송 중 알 수 없는 에러가 발생했습니다.", "error", "전송 오류");
      }
    } finally {
      setSendSubmitting(false);
    }
  };

  // 사용자가 입력한 이메일과 6자리 인증코드가 일치하는지 백엔드에서 대조한 뒤, 규격을 만족하는 임시 비밀번호를 최종 발급받는 핸들러입니다.
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    setForgotError("");
    setTemporaryPassword("");
    try {
      const data = await forgotPassword(forgotEmail, forgotCode);
      setTemporaryPassword(data.temporaryPassword);
    } catch (err: any) {
      if (err.status === 400) {
        setForgotError("입력하신 이메일 인증 코드가 일치하지 않거나 만료되었습니다. 인증번호를 다시 확인해 주세요.");
      } else if (err.status === 404) {
        setForgotError("서비스 데이터베이스에 등록되지 않은 이메일 주소입니다. 가입 정보를 확인하세요.");
      } else {
        setForgotError(err.message || "임시 비밀번호 발급 요청을 처리하지 못했습니다. (서버 오류)");
      }
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

            <label className="auth-field-label" style={{ marginTop: "12px" }}>
              <span>이메일 인증 코드 (6자리)</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  name="verificationCode"
                  readOnly={isCodeVerified}
                  onChange={(event) => setForgotCode(event.target.value)}
                  placeholder="수신된 6자리 코드를 입력하세요"
                  required
                  type="text"
                  maxLength={6}
                  value={forgotCode}
                  style={{ flex: 1 }}
                />
                {!codeSent ? (
                  <button
                    className="secondary-button"
                    disabled={sendSubmitting}
                    onClick={handleSendForgotCode}
                    type="button"
                    style={{ marginTop: 0, padding: "0 12px", whiteSpace: "nowrap", height: "42px", fontSize: "12px" }}
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
                      whiteSpace: "nowrap",
                      height: "42px",
                      fontSize: "12px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "var(--c-green)",
                      borderColor: "var(--c-green)",
                    }}
                  >
                    인증 완료 ✓
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="primary-button"
                      disabled={verifyingSubmitting || forgotCode.length < 6}
                      onClick={handleVerifyCodeSubmit}
                      type="button"
                      style={{ marginTop: 0, padding: "0 12px", whiteSpace: "nowrap", height: "42px", fontSize: "12px" }}
                    >
                      {verifyingSubmitting ? "검증 중" : "코드 확인"}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={sendSubmitting}
                      onClick={handleSendForgotCode}
                      type="button"
                      title="인증코드 재전송"
                      style={{ marginTop: 0, padding: "0 8px", whiteSpace: "nowrap", height: "42px", fontSize: "11px" }}
                    >
                      재전송
                    </button>
                  </div>
                )}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>이메일 주소</span>
            {isCodeVerified && (
              <span style={{ fontSize: "11px", color: "var(--c-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
                <CheckCircle2 size={12} /> 이메일 인증 완료
              </span>
            )}
          </div>
          <div className="input-with-icon">
            <Mail size={16} className="field-icon" />
            <input
              autoComplete="email"
              inputMode="email"
              readOnly={isCodeVerified}
              onChange={(event) => onAuthEmailChange(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={authEmail}
              style={isCodeVerified ? { backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "var(--c-green)" } : undefined}
            />
          </div>
        </label>

        {authMode === "register" && (
          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>이메일 인증 코드 (6자리)</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                name="code"
                readOnly={isCodeVerified}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="수신된 6자리 코드를 입력하세요"
                required
                type="text"
                maxLength={6}
                value={inputCode}
                style={{ flex: 1 }}
              />
              {!codeSent ? (
                <button
                  className="secondary-button"
                  disabled={sendSubmitting}
                  onClick={handleSendCode}
                  type="button"
                  style={{ marginTop: 0, padding: "0 12px", whiteSpace: "nowrap", height: "42px", fontSize: "12px" }}
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
                    whiteSpace: "nowrap",
                    height: "42px",
                    fontSize: "12px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "var(--c-green)",
                    borderColor: "var(--c-green)",
                  }}
                >
                  인증 완료 ✓
                </button>
              ) : (
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="primary-button"
                    disabled={verifyingSubmitting || inputCode.length < 6}
                    onClick={handleVerifyCodeSubmit}
                    type="button"
                    style={{ marginTop: 0, padding: "0 12px", whiteSpace: "nowrap", height: "42px", fontSize: "12px" }}
                  >
                    {verifyingSubmitting ? "검증 중" : "코드 확인"}
                  </button>
                  <button
                    className="secondary-button"
                    disabled={sendSubmitting}
                    onClick={handleSendCode}
                    type="button"
                    title="인증코드 재전송"
                    style={{ marginTop: 0, padding: "0 8px", whiteSpace: "nowrap", height: "42px", fontSize: "11px" }}
                  >
                    재전송
                  </button>
                </div>
              )}
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

        {authMode === "register" && authPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(authPassword) && (
          <p className="form-error" style={{ fontSize: "11px", marginTop: "4px", color: "var(--c-muted)" }}>
            ⚠️ 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.
          </p>
        )}

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

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </article>
    </>
  );
}
