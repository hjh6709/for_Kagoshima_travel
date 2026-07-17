import { useState } from "react";
import { Key, Eye, EyeOff, Lock, User, LogOut } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";

type MyPageTabProps = TripPageProps & {
  onLogout?: () => void;
};

export function MyPageTab({ trip, onLogout }: MyPageTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      const token = localStorage.getItem("accessToken") || "";
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "비밀번호 변경에 실패했습니다.");
      }

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "서버 통신 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("accessToken");
      window.location.reload();
    }
  };

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
            <strong style={{ fontSize: "15px", color: "var(--c-text)" }}>{localStorage.getItem("userEmail") || "인증된 사용자"}</strong>
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
