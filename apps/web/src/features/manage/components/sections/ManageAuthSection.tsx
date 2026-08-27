import { useState, useEffect } from "react";
import { LockKeyhole, Mail, Key, Compass, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { ManageAuthSectionProps } from "../../manageTypes";
import { sendVerificationCode, verifyCode } from "../../../../api/auth";
import { OtpCodeInput } from "../../../../shared/components/OtpCodeInput";
import { ToastNotification, type ToastMessage, type ToastType } from "../../../../shared/components/ToastNotification";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

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
    setShowPassword(false);
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
        showToast("이미 가입된 이메일입니다. 로그인으로 전환해 주세요.", "error", "가입된 계정");
      } else if (err.status === 404 || err.status === 405) {
        showToast("현재 이메일 인증을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.", "error", "인증 서비스 오류");
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
      if (!PASSWORD_PATTERN.test(authPassword)) {
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
      <article className="info-card auth-card auth-card-premium auth-loading">
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

  const isRegister = authMode === "register";
  const passwordInvalid = isRegister && authPassword.length > 0 && !PASSWORD_PATTERN.test(authPassword);

  return (
    <article className="info-card auth-card auth-card-premium">
      {/* 로그인 화면 전체가 배경색 위에 텍스트만 나열된 형태라 "대충 만든" 인상을
          줬다 — 오늘 탭 Next hero 카드와 같은 인디고 그라디언트 문법을 여기도
          가져와서 화면에 실제 구조와 무게감을 준다. 새 장식이 아니라 브랜드가
          이미 쓰는 hero 카드 언어를 재사용한 것이다. */}
      <div className="auth-hero-band">
        <div className="auth-brand-row">
          <a className="auth-product-link" href="/">
            <span className="auth-brand-circle">
              <Compass className="auth-hero-icon" size={23} />
            </span>
            <span>Map Planner</span>
          </a>
          <span className="pill subtle">{isRegister ? "처음 시작" : "여행 관리"}</span>
        </div>

        <h1>{isRegister ? "첫 여행을 시작해 볼까요?" : "내 여행으로 돌아가기"}</h1>
        <p className="muted">
          {isRegister
            ? "이메일을 인증하고 비밀번호를 설정하면 바로 여행을 만들 수 있습니다."
            : "로그인하면 저장한 여행과 일정을 이어서 관리할 수 있습니다."}
        </p>
      </div>

      {isRegister && (
        <ol className="auth-progress" aria-label="회원가입 진행 단계">
          <li className={isCodeVerified ? "is-complete" : "is-current"} aria-current={!isCodeVerified ? "step" : undefined}>
            <span>{isCodeVerified ? <CheckCircle2 aria-hidden="true" size={14} /> : "1"}</span>
            이메일 인증
          </li>
          <li className={isCodeVerified ? "is-current" : ""} aria-current={isCodeVerified ? "step" : undefined}>
            <span>2</span>
            비밀번호 설정
          </li>
        </ol>
      )}

      <form className="auth-form" onSubmit={handleSubmitForm}>
        <div className="auth-field-label">
          <label htmlFor="manage-auth-email">이메일 주소</label>
          <div className="input-with-icon">
            <Mail size={16} className="field-icon" />
            <input
              className={isCodeVerified ? "is-verified" : undefined}
              id="manage-auth-email"
              autoComplete="email"
              inputMode="email"
              readOnly={isCodeVerified}
              onChange={(event) => handleEmailChange(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={authEmail}
            />
          </div>
        </div>

        {isRegister && !codeSent && (
          <button
            aria-busy={sendSubmitting}
            className="secondary-button auth-send-code-button"
            disabled={sendSubmitting}
            onClick={handleSendCode}
            type="button"
          >
            <Mail aria-hidden="true" size={17} />
            {sendSubmitting ? "인증코드 보내는 중" : "인증코드 받기"}
          </button>
        )}

        {isRegister && codeSent && !isCodeVerified && (
          <div className="auth-verification-step">
            <div className="auth-verification-heading">
              <label htmlFor="manage-auth-code">6자리 인증코드</label>
              <button
                aria-busy={sendSubmitting}
                className="auth-inline-action"
                disabled={sendSubmitting}
                onClick={handleSendCode}
                type="button"
              >
                {sendSubmitting ? "보내는 중" : "다시 보내기"}
              </button>
            </div>
            <p className="auth-field-hint" id="manage-auth-code-hint">
              {authEmail}로 보냈습니다. 코드는 5분 동안 유효합니다.
            </p>
            <div className="auth-verification-row">
              <OtpCodeInput
                ariaDescribedBy="manage-auth-code-hint"
                autoFocus
                disabled={verifyingSubmitting}
                id="manage-auth-code"
                onChange={setInputCode}
                value={inputCode}
              />
              <button
                aria-busy={verifyingSubmitting}
                className="primary-button auth-verify-code-button"
                disabled={verifyingSubmitting || inputCode.length < 6}
                onClick={handleVerifyCodeSubmit}
                type="button"
              >
                {verifyingSubmitting ? "확인 중" : "코드 확인"}
              </button>
            </div>
          </div>
        )}

        {isRegister && isCodeVerified && (
          <>
            <input name="code" type="hidden" value={inputCode} />
            <div className="auth-verified-state" role="status">
              <CheckCircle2 aria-hidden="true" size={18} />
              <span><strong>이메일 인증 완료</strong><small>{authEmail}</small></span>
            </div>
          </>
        )}

        {(!isRegister || isCodeVerified) && (
          <div className="auth-field-label">
            <label htmlFor="manage-auth-password">비밀번호</label>
            <div className="input-with-icon">
              <Key size={16} className="field-icon" />
              <input
                id="manage-auth-password"
                aria-describedby={isRegister ? "manage-auth-password-hint" : undefined}
                aria-invalid={passwordInvalid || undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="with-password-toggle"
                minLength={8}
                onChange={(event) => onAuthPasswordChange(event.target.value)}
                placeholder={isRegister ? "안전한 비밀번호 입력" : "비밀번호 입력"}
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
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {isRegister && (
              <p className="auth-field-hint" id="manage-auth-password-hint">
                영문 대·소문자, 숫자, 특수문자를 포함해 8자 이상 입력하세요.
              </p>
            )}
          </div>
        )}

        {passwordInvalid && (
          <p className="form-error" role="alert">
            비밀번호 구성을 다시 확인해 주세요.
          </p>
        )}

        {authError && <p className="form-error" role="alert">{authError}</p>}

        {(!isRegister || isCodeVerified) && (
          <button
            aria-busy={authSubmitting}
            className="primary-button auth-submit-button"
            disabled={authSubmitting}
            type="submit"
          >
            <LockKeyhole aria-hidden="true" size={18} />
            {authSubmitting ? "처리 중" : isRegister ? "계정 만들고 여행 시작" : "로그인"}
          </button>
        )}
      </form>

      <div className="auth-alternative-actions">
        <button
          aria-label={isRegister ? "로그인" : "회원가입"}
          className="auth-text-action"
          onClick={() => onAuthModeChange(isRegister ? "login" : "register")}
          type="button"
        >
          {isRegister ? "이미 계정이 있나요? " : "계정이 없나요? "}
          <strong>{isRegister ? "로그인" : "회원가입"}</strong>
        </button>
        {!isRegister && (
          <button
            aria-label="비밀번호 분실"
            className="auth-text-action"
            onClick={() => setIsForgotMode(true)}
            type="button"
          >
            비밀번호를 잊으셨나요?
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
