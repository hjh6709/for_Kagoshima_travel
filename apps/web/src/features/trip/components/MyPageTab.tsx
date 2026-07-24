import { useState } from "react";
import { Key, Eye, EyeOff, List, Lock, User, LogOut, Settings2 } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";
import { changePassword } from "../../../api/auth";
import { getSavedOwnerAuth } from "../../manage/ownerAuthStorage";

type MyPageTabProps = TripPageProps & {
  onLogout?: () => void;
};

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

  // 사용자가 마이페이지에서 기존 비밀번호와 새 비밀번호를 입력해 비밀번호 변경을 요청하는 핸들러입니다.
  // api/auth.ts 내 공통화된 통신 함수를 호출하여 주소 오타를 차단하고, catch 블록에서 세부 에러를 매핑합니다.
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(newPassword)) {
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

        <article className="info-card auth-card-premium" style={{ marginBottom: "16px", background: "linear-gradient(135deg, rgba(28, 50, 37, 0.03) 0%, rgba(30, 41, 59, 0.03) 100%)" }}>
          <h2 style={{ fontSize: "17px", color: "var(--c-green)", marginBottom: "8px" }}>나만의 맞춤 여행 만들기 ✈️</h2>
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
    <section className="screen">
      <h1>마이페이지</h1>
      <p className="muted">내 계정 정보 관리 및 비밀번호 변경을 지원합니다.</p>

      <article className="info-card auth-card-premium" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(28, 50, 37, 0.05)" }}>
          <div className="auth-brand-circle" style={{ width: "40px", height: "40px" }}>
            <User size={20} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>접속 계정</span>
            <strong style={{ fontSize: "15px", color: "var(--c-text)" }}>{savedAuth?.user.email ?? "인증된 사용자"}</strong>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
          <span className="pill subtle">여정 관리자</span>
          <button
            className="secondary-button compact-button"
            onClick={handleLogoutClick}
            type="button"
            style={{ color: "var(--c-muted)", border: "1px solid rgba(28, 50, 37, 0.1)" }}
          >
            <LogOut size={14} style={{ marginRight: "4px" }} />
            로그아웃
          </button>
        </div>
      </article>

      {editTripHref && (
        <article className="info-card" style={{ marginBottom: "16px" }}>
          <h2>{trip.title}</h2>
          <p className="muted">이 여행의 기본정보, 장소, 항공편, 일정, 체크리스트를 편집합니다.</p>
          <a className="primary-button" href={editTripHref} style={{ marginTop: "8px" }}>
            <Settings2 size={18} />
            이 여행 편집하기
          </a>
          <a className="secondary-button" href="/manage" style={{ marginTop: "8px" }}>
            <List size={18} />
            여행 목록
          </a>
        </article>
      )}

      <section className="section-block">
        <h2>비밀번호 변경</h2>
        <form className="auth-form auth-card-premium" onSubmit={handlePasswordChange} style={{ background: "var(--c-surface)" }}>
          <label className="auth-field-label">
            <span>현재 비밀번호</span>
            <div className="input-with-icon">
              <Key size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호 입력"
                required
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                type="button"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>새 비밀번호</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상 입력"
                required
                type={showNew ? "text" : "password"}
                value={newPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                type="button"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {newPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(newPassword) && (
            <p className="form-error" style={{ fontSize: "11px", marginTop: "4px", color: "var(--c-muted)", paddingLeft: "42px" }}>
              ⚠️ 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.
            </p>
          )}

          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>새 비밀번호 확인</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
                required
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                type="button"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && <p className="form-error" style={{ marginTop: "8px" }}>{error}</p>}
          {message && <p style={{ color: "var(--c-green)", fontSize: "13px", fontWeight: 700, marginTop: "8px" }}>{message}</p>}

          <button className="primary-button" disabled={submitting} type="submit" style={{ marginTop: "16px" }}>
            비밀번호 변경 완료
          </button>
        </form>
      </section>
    </section>
  );
}
