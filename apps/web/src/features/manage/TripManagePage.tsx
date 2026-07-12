import { ManageAuthSection } from "./components/ManageAuthSection";
import { ManageHeader } from "./components/ManageHeader";
import { SelectedTripDetailSection } from "./components/SelectedTripDetailSection";
import { TripCreateSection } from "./components/TripCreateSection";
import { TripListSection } from "./components/TripListSection";
import type { TripManagePageProps } from "./manageTypes";

// 라우팅, API 호출, 세션 상태는 App.tsx가 담당한다.
// 이 컴포넌트는 관리 화면의 섹션 컴포넌트를 조립하는 역할만 맡는다.
export function TripManagePage(props: TripManagePageProps) {
  const { auth, authChecked, onLogout } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <ManageHeader auth={auth} onLogout={onLogout} />
                <SelectedTripDetailSection {...props} />
                <TripCreateSection {...props} />
                <TripListSection {...props} />
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
