import { List, Settings2 } from "lucide-react";
import type { AuthResponse } from "../../../../api/auth";
import {
  AccountDeletionSection,
  AccountSummaryCard,
  PasswordSettingsSection,
} from "../../../account/AccountSettings";
import type { TripPageProps } from "../../tripPageTypes";

type MyPageTabProps = TripPageProps & {
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
      <section className="screen">
        <h1>마이페이지</h1>
        <p className="muted">
          체험용 데모 화면입니다. 계정을 만들어 나만의 여행을 보관하세요.
        </p>

        <article
          className="info-card auth-card-premium"
          style={{ marginBottom: "16px" }}
        >
          <h2
            style={{
              fontSize: "17px",
              color: "var(--c-route)",
              marginBottom: "8px",
            }}
          >
            나만의 맞춤 여행 만들기 ✈️
          </h2>
          <p
            className="muted"
            style={{
              lineHeight: 1.5,
              margin: "8px 0 16px",
              fontSize: "13.5px",
            }}
          >
            회원가입 후 로그인하시면 아래의 풍부한 개인화 기능을 평생 무료로
            활용하실 수 있습니다.
          </p>
          <ul
            style={{
              paddingLeft: "18px",
              margin: "0 0 20px 0",
              display: "grid",
              gap: "10px",
              color: "var(--c-text)",
              fontSize: "13px",
              listStyleType: "disc",
            }}
          >
            <li>
              📍 <strong>자유로운 여정 생성 & 구글 지도 실시간 연동</strong>
            </li>
            <li>
              👥 <strong>동반자에게 카카오톡/문자로 공유 링크 전송</strong>
            </li>
            <li>
              💬{" "}
              <strong>
                중국·일본 현지 맞춤 환율 계산 및 생존 회화 편의 기능
              </strong>
            </li>
            <li>
              ✅{" "}
              <strong>
                출발 전 체크리스트 및 세부 일정 달성도 다이내믹 프로그레스 바
              </strong>
            </li>
          </ul>
          <a
            className="primary-button"
            href="/manage"
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 700,
              display: "block",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            로그인 / 회원가입하고 시작하기
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
