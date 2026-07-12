import { LogOut, UserRound } from "lucide-react";
import type { AuthResponse } from "../../../api/auth";

type ManageHeaderProps = {
  auth: AuthResponse;
  onLogout: () => void;
};

// 관리 화면의 계정 헤더와 여행 화면 이동 CTA를 한곳에 둔다.
export function ManageHeader({ auth, onLogout }: ManageHeaderProps) {
  return (
    <>
      <div className="owner-header">
        <div>
          <span className="eyebrow">여행 관리 계정</span>
          <h1>여행 관리</h1>
          <p className="muted">{auth.user.email}</p>
        </div>
        <button className="icon-button neutral" onClick={onLogout} type="button" aria-label="로그아웃">
          <LogOut size={18} />
        </button>
      </div>

      <article className="hero-card">
        <div>
          <span className="pill">내 여행</span>
          <h2>관리할 여행을 선택하세요</h2>
          <p className="muted">로그인한 계정으로 여행을 만들고, 이후 일정과 장소를 연결합니다.</p>
        </div>
        <a className="primary-button" href="/">
          <UserRound size={18} />
          여행 화면 보기
        </a>
      </article>
    </>
  );
}
