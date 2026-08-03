import { useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogOut,
  Trash2,
  User,
} from "lucide-react";
import {
  changePassword,
  deleteAccount,
  type AuthResponse,
} from "../../api/auth";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

type AccountSummaryCardProps = {
  email: string;
  onLogout: () => void | Promise<void>;
};

export function AccountSummaryCard({
  email,
  onLogout,
}: AccountSummaryCardProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await onLogout();
    } catch {
      setLogoutError("로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <article className="mypage-account-card" aria-label="계정 정보">
      <div className="mypage-account-main">
        <div className="auth-brand-circle mypage-avatar">
          <User size={20} />
        </div>
        <div className="mypage-account-copy">
          <span>접속 계정</span>
          <strong>{email}</strong>
        </div>
      </div>

      <div className="mypage-account-footer">
        <span className="pill subtle">여정 관리자</span>
        <button
          className="mypage-logout-button"
          disabled={loggingOut}
          onClick={handleLogout}
          type="button"
        >
          <LogOut size={16} />
          {loggingOut ? "로그아웃 중" : "로그아웃"}
        </button>
      </div>
      {logoutError && (
        <p className="form-error" role="alert">
          {logoutError}
        </p>
      )}
    </article>
  );
}

type PasswordSettingsSectionProps = {
  accessToken: string;
  onAuthChanged: (auth: AuthResponse) => void;
};

export function PasswordSettingsSection({
  accessToken,
  onAuthChanged,
}: PasswordSettingsSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isNewPasswordValid = PASSWORD_PATTERN.test(newPassword);
  const doPasswordsMatch =
    confirmPassword.length === 0 || newPassword === confirmPassword;

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError(
        "새 비밀번호는 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함하여 8자 이상이어야 합니다.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const nextAuth = await changePassword(
        accessToken,
        currentPassword,
        newPassword,
      );
      onAuthChanged(nextAuth);
      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caughtError: any) {
      if (caughtError.status === 400) {
        setError(
          "현재 사용 중인 비밀번호가 일치하지 않거나 입력 규격이 잘못되었습니다.",
        );
      } else if (caughtError.status === 401) {
        setError(
          "로그인 세션이 만료되었습니다. 다시 로그인한 뒤 변경을 시도해 주세요.",
        );
      } else if (caughtError.status === 404) {
        setError("존재하지 않거나 삭제된 사용자 정보입니다.");
      } else {
        setError(
          caughtError.message ||
            "서버 통신 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mypage-section" aria-labelledby="mypage-security">
      <h2 className="mypage-section-title" id="mypage-security">
        보안
      </h2>
      <details className="mypage-security-card">
        <summary className="mypage-security-summary">
          <span className="mypage-security-icon" aria-hidden="true">
            <Key size={19} />
          </span>
          <span className="mypage-security-copy">
            <strong>비밀번호 변경</strong>
            <span>현재 비밀번호를 확인한 뒤 변경할 수 있습니다.</span>
          </span>
          <ChevronDown
            className="mypage-security-chevron"
            size={20}
            aria-hidden="true"
          />
        </summary>

        <div className="mypage-security-content">
          <form
            className="auth-form mypage-password-form"
            onSubmit={handlePasswordChange}
          >
            <label className="auth-field-label">
              <span>현재 비밀번호</span>
              <div className="input-with-icon">
                <Key size={16} className="field-icon" />
                <input
                  className="with-password-toggle"
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="현재 비밀번호"
                  required
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                />
                <button
                  className="password-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  type="button"
                  aria-label={
                    showCurrent ? "현재 비밀번호 숨기기" : "현재 비밀번호 보기"
                  }
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
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="새 비밀번호"
                  required
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                />
                <button
                  className="password-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  type="button"
                  aria-label={
                    showNew ? "새 비밀번호 숨기기" : "새 비밀번호 보기"
                  }
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="새 비밀번호 확인"
                  required
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                />
                <button
                  className="password-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  type="button"
                  aria-label={
                    showConfirm
                      ? "새 비밀번호 확인 숨기기"
                      : "새 비밀번호 확인 보기"
                  }
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <p
              className={`mypage-field-help${!doPasswordsMatch ? " is-error" : ""}`}
              id="confirm-password-help"
            >
              {!doPasswordsMatch
                ? "새 비밀번호가 일치하지 않습니다."
                : "같은 비밀번호를 한 번 더 입력해 주세요."}
            </p>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="form-success" role="status">
                {message}
              </p>
            )}

            <button
              className="primary-button mypage-password-submit"
              disabled={
                submitting ||
                !currentPassword ||
                !isNewPasswordValid ||
                !confirmPassword ||
                !doPasswordsMatch
              }
              type="submit"
            >
              {submitting ? "변경 중…" : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}

type AccountDeletionSectionProps = {
  accessToken: string;
  onDeleted: () => void;
};

export function AccountDeletionSection({
  accessToken,
  onDeleted,
}: AccountDeletionSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmed || !currentPassword) return;

    setSubmitting(true);
    setError("");
    try {
      await deleteAccount(accessToken, currentPassword);
      onDeleted();
      window.history.replaceState(null, "", "/manage");
    } catch (caughtError: any) {
      if (caughtError.status === 400) {
        setError("현재 비밀번호가 일치하지 않습니다.");
      } else if (caughtError.status === 401) {
        setError("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      } else {
        setError(
          caughtError.message ||
            "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="mypage-section"
      aria-labelledby="mypage-account-deletion"
    >
      <h2 className="mypage-section-title" id="mypage-account-deletion">
        계정 삭제
      </h2>
      <details className="mypage-security-card mypage-danger-card">
        <summary className="mypage-security-summary">
          <span className="mypage-security-icon" aria-hidden="true">
            <Trash2 size={19} />
          </span>
          <span className="mypage-security-copy">
            <strong>내 계정과 여행 데이터 삭제</strong>
            <span>계정에 저장된 여행과 체크리스트가 모두 삭제됩니다.</span>
          </span>
          <ChevronDown
            className="mypage-security-chevron"
            size={20}
            aria-hidden="true"
          />
        </summary>

        <div className="mypage-security-content">
          <form
            className="auth-form mypage-password-form"
            onSubmit={handleDeleteAccount}
          >
            <p className="mypage-delete-warning">
              삭제 후에는 계정과 여행 데이터를 복구할 수 없습니다.
            </p>
            <label className="auth-field-label">
              <span>현재 비밀번호</span>
              <div className="input-with-icon">
                <Key size={16} className="field-icon" />
                <input
                  autoComplete="current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="현재 비밀번호"
                  required
                  type="password"
                  value={currentPassword}
                />
              </div>
            </label>
            <label className="mypage-delete-confirm">
              <input
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                type="checkbox"
              />
              <span>모든 여행 데이터가 영구 삭제되는 것을 이해했습니다.</span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="danger-button mypage-delete-submit"
              disabled={submitting || !currentPassword || !confirmed}
              type="submit"
            >
              {submitting ? "삭제 중…" : "계정 영구 삭제"}
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}
