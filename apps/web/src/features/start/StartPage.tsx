import { ArrowRight, CalendarDays, Compass, LogIn, MapPin, Navigation, Route } from "lucide-react";

// 서비스 루트(`/`)에서 보여주는 시작 화면이다.
// 실제 여행 편집은 /manage, 공유 확인은 /share/{token}, 기존 샘플 화면은 /demo로 분리한다.
export function StartPage() {
  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen start-screen">
            <header className="start-hero">
              <div className="start-brand">
                <span className="start-brand-mark">
                  <Compass aria-hidden="true" size={22} />
                </span>
                <strong>Map Planner</strong>
              </div>
              <span className="screen-kicker">YOUR POCKET ATLAS</span>
              <h1>여행의 장소와 시간을 하나의 동선으로</h1>
              <p>
                카페와 식당부터 항공편까지 저장하고, 일정에 연결한 뒤 여행지에 맞는 지도로 길을 찾으세요.
              </p>
            </header>

            <div className="start-route-preview" aria-label="Map Planner 사용 흐름">
              <div className="start-route-stop">
                <span><MapPin aria-hidden="true" size={16} /></span>
                <div>
                  <strong>장소 찾기</strong>
                  <small>이름으로 검색하고 저장</small>
                </div>
              </div>
              <div className="start-route-stop">
                <span><CalendarDays aria-hidden="true" size={16} /></span>
                <div>
                  <strong>일정에 연결</strong>
                  <small>날짜와 시간 순서로 구성</small>
                </div>
              </div>
              <div className="start-route-stop destination">
                <span><Navigation aria-hidden="true" size={16} /></span>
                <div>
                  <strong>바로 길찾기</strong>
                  <small>Google 지도 또는 현지 지도 선택</small>
                </div>
              </div>
            </div>

            <div className="start-action-stack">
              <a className="primary-button start-primary-action" href="/manage">
                <LogIn aria-hidden="true" size={18} />
                로그인하고 여행 만들기
                <ArrowRight aria-hidden="true" className="trailing-icon" size={17} />
              </a>
              <a className="secondary-button start-secondary-action" href="/demo">
                <Route aria-hidden="true" size={18} />
                샘플 여행 동선 보기
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
