import { LockKeyhole } from "lucide-react";
import type { TripManagePageProps } from "../manageTypes";

type ManageAuthSectionProps = Pick<
  TripManagePageProps,
  | "auth"
  | "authChecked"
  | "authEmail"
  | "authError"
  | "authMode"
  | "authPassword"
  | "authSubmitting"
  | "onAuthEmailChange"
  | "onAuthModeChange"
  | "onAuthPasswordChange"
  | "onSubmitAuth"
>;

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
  if (authChecked && auth) {
    return null;
  }

  if (!authChecked) {
    return (
      <article className="info-card auth-card">
        <span className="pill">여행 관리 계정</span>
        <h1>로그인 확인 중</h1>
        <p className="muted">저장된 로그인 정보를 확인하고 있습니다.</p>
      </article>
    );
  }

  return (
    <article className="info-card auth-card">
      <span className="pill">여행 관리 계정</span>
      <h1>{authMode === "login" ? "여행 관리 로그인" : "여행 관리 계정 만들기"}</h1>
      <p className="muted">
        처음 사용하는 경우 계정을 만든 뒤 여행을 생성합니다. 공유 링크를 받은 가족이나 동행자는 로그인 없이 읽기
        전용으로 확인합니다.
      </p>

      <form className="auth-form" onSubmit={onSubmitAuth}>
        <label>
          이메일
          <input
            autoComplete="email"
            inputMode="email"
            onChange={(event) => onAuthEmailChange(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={authEmail}
          />
        </label>
        <label>
          비밀번호
          <input
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            minLength={8}
            onChange={(event) => onAuthPasswordChange(event.target.value)}
            placeholder="8자 이상"
            required
            type="password"
            value={authPassword}
          />
        </label>

        {authError && <p className="form-error">{authError}</p>}

        <button className="primary-button" disabled={authSubmitting} type="submit">
          <LockKeyhole size={18} />
          {authSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>

      <button
        className="secondary-button auth-switch-button"
        onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
        type="button"
      >
        {authMode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
      </button>

      <p className="auth-help">
        로컬 개발은 <code>VITE_API_BASE_URL=http://localhost:8080</code> 설정이 필요합니다.
      </p>
    </article>
  );
}
