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
          <h1>내 여행 관리</h1>
          <p className="muted">{auth.user.email}</p>
        </div>
        <button className="icon-button neutral" onClick={onLogout} type="button" aria-label="로그아웃">
          <LogOut size={18} />
        </button>
      </div>

      <article className="hero-card">
        <div>
          <span className="pill">내 여행</span>
          <h2>여행 정보를 입력하고 공유 링크를 만듭니다</h2>
          <p className="muted">여행을 선택하면 기본 정보, 장소, 항공편, 일정을 한 화면에서 편집할 수 있습니다.</p>
        </div>
        <a className="primary-button" href="/demo">
          <UserRound size={18} />
          샘플 여행 화면 보기
        </a>
      </article>
    </>
  );
}
