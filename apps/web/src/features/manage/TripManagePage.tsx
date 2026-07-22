import { ManageAuthSection } from "./components/ManageAuthSection";
import { ManageFlowGuide } from "./components/ManageFlowGuide";
import { ManageHeader } from "./components/ManageHeader";
import { TripCreateSection } from "./components/TripCreateSection";
import { TripListSection } from "./components/TripListSection";
import type { TripManagePageProps } from "./manageTypes";

// API 호출과 세션 상태는 useTripManageController가 담당한다.
// 이 컴포넌트는 여행 목록과 새 여행 생성만 다룬다 — 특정 여행 보기/편집은 /manage/trips/:id로 분리됐다.
export function TripManagePage(props: TripManagePageProps) {
  const { auth, authChecked, onLogout, ownerTrips } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <ManageHeader auth={auth} onLogout={onLogout} />
                <ManageFlowGuide hasSelectedTrip={false} tripCount={ownerTrips.length} />
                <TripListSection {...props} />
                <TripCreateSection {...props} />
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
