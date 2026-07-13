import { ClipboardList, ExternalLink, Link2, LogIn, Plane } from "lucide-react";

// 서비스 루트(`/`)에서 보여주는 시작 화면이다.
// 실제 여행 편집은 /manage, 공유 확인은 /share/{token}, 기존 샘플 화면은 /demo로 분리한다.
export function StartPage() {
  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen start-screen">
            <div className="start-hero">
              <span className="pill">여행 공유 서비스</span>
              <h1>여행 정보를 한곳에서 만들고 공유하세요</h1>
              <p className="muted">
                여행 생성자는 로그인해서 일정, 장소, 항공편, 공유 링크를 관리하고 가족이나 동행자는 공유 링크로
                읽기 전용 화면을 확인합니다.
              </p>
            </div>

            <div className="start-action-stack">
              <a className="primary-button start-primary-action" href="/manage">
                <LogIn size={18} />
                로그인하고 여행 관리하기
              </a>
              <a className="secondary-button start-secondary-action" href="/demo">
                <Plane size={18} />
                샘플 여행 화면 보기
              </a>
            </div>

            <section className="start-guide-card">
              <div className="section-title-row compact-title-row">
                <div>
                  <h2>사용 흐름</h2>
                  <p className="section-caption">처음 접속한 사용자가 따라가야 할 기본 순서입니다.</p>
                </div>
              </div>

              <ol className="start-guide-list">
                <li>
                  <ClipboardList size={18} />
                  <div>
                    <strong>여행 생성자</strong>
                    <span>로그인 후 여행을 만들고 정보를 입력합니다.</span>
                  </div>
                </li>
                <li>
                  <Link2 size={18} />
                  <div>
                    <strong>공유 링크 생성</strong>
                    <span>여행 상세에서 읽기 전용 공유 링크를 만듭니다.</span>
                  </div>
                </li>
                <li>
                  <ExternalLink size={18} />
                  <div>
                    <strong>가족/동행자 확인</strong>
                    <span>받은 `/share/...` 링크를 열어 로그인 없이 확인합니다.</span>
                  </div>
                </li>
              </ol>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
