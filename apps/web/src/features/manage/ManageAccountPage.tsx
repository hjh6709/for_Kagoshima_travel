import { ChevronLeft } from "lucide-react";
import { AccountSummaryCard, PasswordSettingsSection } from "../account/AccountSettings";
import { ManageAuthSection } from "./components";
import type { TripManagePageProps } from "./manageTypes";

export function ManageAccountPage(props: TripManagePageProps) {
  const { auth, authChecked, onLogout } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className={`screen owner-screen${authChecked && auth ? " mypage-screen" : ""}`}>
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <a className="back-to-list-link account-back-link" href="/manage">
                  <ChevronLeft aria-hidden="true" size={18} />
                  여행 목록
                </a>

                <header className="mypage-header">
                  <h1>마이페이지</h1>
                  <p>계정과 보안 설정을 관리합니다.</p>
                </header>

                <AccountSummaryCard email={auth.user.email} onLogout={onLogout} />
                <PasswordSettingsSection accessToken={auth.accessToken} />
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
