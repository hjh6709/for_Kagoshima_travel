import {
  ArrowRight,
  CalendarCheck2,
  ChevronRight,
  List,
  MapPinned,
  Settings2,
  Share2,
} from "lucide-react";
import type { AuthResponse } from "../../../../api/auth";
import {
  AccountDeletionSection,
  AccountSummaryCard,
  PasswordSettingsSection,
} from "../../../account/AccountSettings";
import type { TripPageProps } from "../../tripPageTypes";

type MyPageTabProps = Pick<
  TripPageProps,
  "editTripHref" | "isDemo" | "trip"
> & {
  auth?: AuthResponse | null;
  onAuthChanged?: (auth: AuthResponse) => void;
  onLogout?: () => void;
};

export function MyPageTab({
  auth,
  trip,
  onAuthChanged,
  onLogout,
  editTripHref,
  isDemo,
}: MyPageTabProps) {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  if (isDemo) {
    return (
      <section className="screen mypage-screen">
        <header className="mypage-header">
          <h1>마이페이지</h1>
          <p>지금은 체험 여행을 보고 있습니다.</p>
        </header>

        <article className="mypage-demo-card">
          <div className="mypage-demo-heading">
            <span>내 여행으로 시작하기</span>
            <h2>계정을 만들고 여행 계획을 저장하세요</h2>
            <p>
              장소를 찾고 날짜별 일정을 만든 뒤 동행자에게 같은 여행을 공유할
              수 있습니다.
            </p>
          </div>

          <ul className="mypage-demo-feature-list">
            <li>
              <span className="mypage-demo-feature-icon" aria-hidden="true">
                <MapPinned size={19} />
              </span>
              <div>
                <strong>장소 검색과 지도 확인</strong>
                <span>숙소·식당·카페를 찾아 저장하고 길찾기로 연결합니다.</span>
              </div>
            </li>
            <li>
              <span className="mypage-demo-feature-icon" aria-hidden="true">
                <CalendarCheck2 size={19} />
              </span>
              <div>
                <strong>날짜별 일정과 준비물</strong>
                <span>하루 동선과 여행 전 체크리스트를 함께 관리합니다.</span>
              </div>
            </li>
            <li>
              <span className="mypage-demo-feature-icon" aria-hidden="true">
                <Share2 size={19} />
              </span>
              <div>
                <strong>읽기 전용 여행 공유</strong>
                <span>동행자가 로그인 없이 최신 계획을 확인할 수 있습니다.</span>
              </div>
            </li>
          </ul>

          <a className="primary-button mypage-demo-action" href="/manage">
            내 여행 만들기
            <ArrowRight aria-hidden="true" size={18} />
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

      <AccountSummaryCard
        email={auth?.user.email ?? "인증된 사용자"}
        onLogout={handleLogoutClick}
      />

      {editTripHref && (
        <section
          className="mypage-section"
          aria-labelledby="mypage-current-trip"
        >
          <h2 className="mypage-section-title" id="mypage-current-trip">
            현재 여행
          </h2>
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

      <section className="mypage-section" aria-labelledby="mypage-settings">
        <h2 className="mypage-section-title" id="mypage-settings">
          설정
        </h2>
        <div className="mypage-setting-list">
          {/* 대응하는 기능이 아직 없다. 값이 켜져 있는 것처럼 보이면 거짓말이 되므로
              눌리지 않게 두고 준비 중임을 그대로 밝힌다. */}
          {["여행 알림", "언어", "오프라인 저장"].map((label) => (
            <button className="mypage-setting-row" disabled key={label} type="button">
              <span>{label}</span>
              <span className="mypage-setting-value">
                준비 중
                <ChevronRight aria-hidden="true" size={17} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <PasswordSettingsSection
        accessToken={auth?.accessToken ?? ""}
        onAuthChanged={onAuthChanged ?? (() => {})}
      />
      <AccountDeletionSection
        accessToken={auth?.accessToken ?? ""}
        onDeleted={handleLogoutClick}
      />
    </section>
  );
}
