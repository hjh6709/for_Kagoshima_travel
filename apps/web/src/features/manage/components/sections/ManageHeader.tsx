import { User } from "lucide-react";
import type { AuthResponse } from "../../../../api/auth";

type ManageHeaderProps = {
  auth: AuthResponse;
};

// 로그인 후 첫 화면에서는 제품 설명보다 사용자의 여행이 먼저 보이도록 계정 정보만 간결하게 표시한다.
export function ManageHeader({ auth }: ManageHeaderProps) {
  return (
    <header className="owner-header">
      <div>
        <span className="eyebrow">Map Planner</span>
        <h1>내 여행</h1>
        <p className="owner-account-email">{auth.user.email}</p>
      </div>
      <a className="secondary-button compact-button owner-account-link" href="/manage/account">
        <User aria-hidden="true" size={18} />
        마이페이지
      </a>
    </header>
  );
}
