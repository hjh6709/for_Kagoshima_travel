import { ClipboardList, ExternalLink, Link2, LogIn, Plane, Compass } from "lucide-react";

// 서비스 루트(`/`)에서 보여주는 시작 화면이다.
// 실제 여행 편집은 /manage, 공유 확인은 /share/{token}, 기존 샘플 화면은 /demo로 분리한다.
export function StartPage() {
  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen start-screen">
            <div className="start-hero" style={{ textAlign: "center", display: "grid", placeItems: "center", gap: "12px", padding: "16px 0 8px" }}>
              <div className="brand-badge-circle" style={{ width: "48px", height: "48px", background: "var(--c-green-light)", color: "var(--c-green)" }}>
                <Compass className="auth-hero-icon" size={26} />
              </div>
              <span className="pill subtle" style={{ marginTop: "4px" }}>Map Planner</span>
              <h1 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }}>여정을 그리는 가장 설레는 방법</h1>
              <p className="muted" style={{ fontSize: "14px", lineHeight: 1.5, margin: "0 10px" }}>
                일정, 장소, 항공편을 입력하여 나만의 여행 가이드를 완성하고, 공유 링크로 가족이나 동행자에게 간편하게 전달하세요.
              </p>
            </div>

            <div className="start-action-stack">
              <a className="primary-button start-primary-action" href="/manage" style={{ padding: "14px 16px" }}>
                <LogIn size={18} />
                로그인하고 여행 관리하기
              </a>
              <a className="secondary-button start-secondary-action" href="/demo" style={{ padding: "12px 14px", border: "1px solid rgba(28, 50, 37, 0.15)", background: "transparent", color: "var(--c-green)" }}>
                <Plane size={18} />
                샘플 여행 화면 구경하기
              </a>
            </div>

            <section className="start-guide-card auth-card-premium" style={{ marginTop: "14px" }}>
              <div className="section-title-row compact-title-row" style={{ marginBottom: "14px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700 }}>간편한 3단계 사용 흐름</h2>
                  <p className="section-caption" style={{ color: "var(--c-muted)", fontSize: "12px" }}>여정 생성이 처음이시라면 아래 단계를 차례로 수행해 보세요.</p>
                </div>
              </div>

              <ol className="start-guide-list">
                <li style={{ transition: "transform 0.2s" }}>
                  <div className="brand-badge-circle" style={{ width: "36px", height: "36px" }}>
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px" }}>1. 여정 생성 및 정보 입력</strong>
                    <span style={{ fontSize: "12px" }}>로그인 후 여행 도시를 정하고 장소와 교통편을 채워 넣습니다.</span>
                  </div>
                </li>
                <li style={{ transition: "transform 0.2s" }}>
                  <div className="brand-badge-circle" style={{ width: "36px", height: "36px" }}>
                    <Link2 size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px" }}>2. 실시간 공유 링크 발행</strong>
                    <span style={{ fontSize: "12px" }}>여행 관리 상세판에서 한 번의 터치로 전용 공유 URL을 생성합니다.</span>
                  </div>
                </li>
                <li style={{ transition: "transform 0.2s" }}>
                  <div className="brand-badge-circle" style={{ width: "36px", height: "36px" }}>
                    <ExternalLink size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px" }}>3. 로그인 없는 간편 확인</strong>
                    <span style={{ fontSize: "12px" }}>동행인은 별도의 회원가입 없이 받은 링크로 일정을 바로 읽어봅니다.</span>
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
