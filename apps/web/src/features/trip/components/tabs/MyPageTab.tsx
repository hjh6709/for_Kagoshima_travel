import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Key, List, Lock, LogOut, Settings2, User } from "lucide-react";
import { changePassword } from "../../../../api/auth";
import { getSavedOwnerAuth } from "../../../manage/ownerAuthStorage";
import type { TripPageProps } from "../../tripPageTypes";

type MyPageTabProps = TripPageProps & {
  onLogout?: () => void;
};

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function MyPageTab({ trip, onLogout, editTripHref, isDemo }: MyPageTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savedAuth = getSavedOwnerAuth();
  const isNewPasswordValid = PASSWORD_PATTERN.test(newPassword);
  const doPasswordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;

  // 사용자가 마이페이지에서 기존 비밀번호와 새 비밀번호를 입력해 비밀번호 변경을 요청하는 핸들러입니다.
  // api/auth.ts 내 공통화된 통신 함수를 호출하여 주소 오타를 차단하고, catch 블록에서 세부 에러를 매핑합니다.
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError("새 비밀번호는 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함하여 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const token = savedAuth?.accessToken ?? "";
      await changePassword(token, currentPassword, newPassword);

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      // ApiError에서 맵핑된 HTTP status 코드를 기반으로, 세부 원인을 구체적으로 설명합니다.
      if (err.status === 400) {
        setError("현재 사용 중인 비밀번호가 일치하지 않거나 입력 규격이 잘못되었습니다.");
      } else if (err.status === 401) {
        setError("로그인 세션이 만료되었습니다. 다시 로그인한 뒤 변경을 시도해 주세요.");
      } else if (err.status === 404) {
        setError("존재하지 않거나 삭제된 사용자 정보입니다.");
      } else {
        setError(err.message || "서버 통신 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  if (isDemo) {
    return (
      <section className="screen">
        <h1>마이페이지</h1>
        <p className="muted">체험용 데모 화면입니다. 계정을 만들어 나만의 여행을 보관하세요.</p>

        <article className="info-card auth-card-premium" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "17px", color: "var(--c-route)", marginBottom: "8px" }}>나만의 맞춤 여행 만들기 ✈️</h2>
          <p className="muted" style={{ lineHeight: 1.5, margin: "8px 0 16px", fontSize: "13.5px" }}>
            회원가입 후 로그인하시면 아래의 풍부한 개인화 기능을 평생 무료로 활용하실 수 있습니다.
          </p>
          <ul style={{ paddingLeft: "18px", margin: "0 0 20px 0", display: "grid", gap: "10px", color: "var(--c-text)", fontSize: "13px", listStyleType: "disc" }}>
            <li>📍 <strong>자유로운 여정 생성 & 구글 지도 실시간 연동</strong></li>
            <li>👥 <strong>동반자에게 카카오톡/문자로 공유 링크 전송</strong></li>
            <li>💬 <strong>중국·일본 현지 맞춤 환율 계산 및 생존 회화 편의 기능</strong></li>
            <li>✅ <strong>출발 전 체크리스트 및 세부 일정 달성도 다이내믹 프로그레스 바</strong></li>
          </ul>
          <a className="primary-button" href="/manage" style={{ padding: "12px", fontSize: "14px", fontWeight: 700, display: "block", textAlign: "center", textDecoration: "none" }}>
            로그인 / 회원가입하고 시작하기
          </a>
        </article>
      </section>
    );
  }

  return (
    <section className="screen mypage-screen">
      <header className="mypage-header">
        <h1>마이페이지</h1>
        <p>계정과 여행 설정을 관리합니다.</p>
      </header>

      <article className="mypage-account-card" aria-label="계정 정보">
        <div className="mypage-account-main">
          <div className="auth-brand-circle mypage-avatar">
            <User size={20} />
          </div>
          <div className="mypage-account-copy">
            <span>접속 계정</span>
            <strong>{savedAuth?.user.email ?? "인증된 사용자"}</strong>
          </div>
        </div>

        <div className="mypage-account-footer">
          <span className="pill subtle">여정 관리자</span>
          <button
            className="mypage-logout-button"
            onClick={handleLogoutClick}
            type="button"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </article>

      {editTripHref && (
        <section className="mypage-section" aria-labelledby="mypage-current-trip">
          <h2 className="mypage-section-title" id="mypage-current-trip">현재 여행</h2>
          <article className="mypage-trip-card">
            <div className="mypage-trip-copy">
              <span className="mypage-route-stop" aria-hidden="true" />
              <div>
                <h3>{trip.title}</h3>
                <p>장소 · 일정 · 항공편 · 체크리스트 관리</p>
              </div>
            </div>
            <div className="mypage-trip-actions">
              <a className="primary-button" href={editTripHref}>
                <Settings2 size={18} />
                여행 편집
              </a>
              <a className="secondary-button" href="/manage">
                <List size={18} />
                여행 목록
              </a>
            </div>
          </article>
        </section>
      )}

      <section className="mypage-section" aria-labelledby="mypage-security">
        <h2 className="mypage-section-title" id="mypage-security">보안</h2>
        <details className="mypage-security-card">
          <summary className="mypage-security-summary">
            <span className="mypage-security-icon" aria-hidden="true">
              <Key size={19} />
            </span>
            <span className="mypage-security-copy">
              <strong>비밀번호 변경</strong>
              <span>현재 비밀번호를 확인한 뒤 변경할 수 있습니다.</span>
            </span>
            <ChevronDown className="mypage-security-chevron" size={20} aria-hidden="true" />
          </summary>

          <div className="mypage-security-content">
            <form className="auth-form mypage-password-form" onSubmit={handlePasswordChange}>
              <label className="auth-field-label">
                <span>현재 비밀번호</span>
                <div className="input-with-icon">
                  <Key size={16} className="field-icon" />
                  <input
                    className="with-password-toggle"
                    autoComplete="current-password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호"
                    required
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={() => setShowCurrent(!showCurrent)}
                    type="button"
                    aria-label={showCurrent ? "현재 비밀번호 숨기기" : "현재 비밀번호 보기"}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="auth-field-label">
                <span>새 비밀번호</span>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    className="with-password-toggle"
                    aria-describedby="new-password-help"
                    aria-invalid={newPassword.length > 0 && !isNewPasswordValid}
                    autoComplete="new-password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호"
                    required
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={() => setShowNew(!showNew)}
                    type="button"
                    aria-label={showNew ? "새 비밀번호 숨기기" : "새 비밀번호 보기"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <p
                className={`mypage-field-help${newPassword && !isNewPasswordValid ? " is-error" : ""}`}
                id="new-password-help"
              >
                8자 이상, 영문 대·소문자, 숫자, 특수문자를 포함해 주세요.
              </p>

              <label className="auth-field-label">
                <span>새 비밀번호 확인</span>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input
                    className="with-password-toggle"
                    aria-describedby="confirm-password-help"
                    aria-invalid={confirmPassword.length > 0 && !doPasswordsMatch}
                    autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 확인"
                    required
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    type="button"
                    aria-label={showConfirm ? "새 비밀번호 확인 숨기기" : "새 비밀번호 확인 보기"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <p
                className={`mypage-field-help${!doPasswordsMatch ? " is-error" : ""}`}
                id="confirm-password-help"
              >
                {!doPasswordsMatch ? "새 비밀번호가 일치하지 않습니다." : "같은 비밀번호를 한 번 더 입력해 주세요."}
              </p>

              {error && <p className="form-error" role="alert">{error}</p>}
              {message && <p className="form-success" role="status">{message}</p>}

              <button
                className="primary-button mypage-password-submit"
                disabled={submitting || !currentPassword || !isNewPasswordValid || !confirmPassword || !doPasswordsMatch}
                type="submit"
              >
                {submitting ? "변경 중…" : "비밀번호 변경"}
              </button>
            </form>
          </div>
        </details>
      </section>
    </section>
  );
}
