import { Route } from "lucide-react";
import type { RecommendedRoute } from "../../../types/travel";

type RecommendedRoutesSectionProps = {
  routes: RecommendedRoute[];
};

// 여행자가 참고할 추천 루트 목록만 표시한다.
export function RecommendedRoutesSection({ routes }: RecommendedRoutesSectionProps) {
  return (
    <section className="section-block" style={{ display: "grid", gap: "12px" }}>
      <h2 style={{ marginBottom: "4px" }}>추천 루트</h2>
      {routes.map((route) => (
        <article
          key={route.id}
          style={{
            display: "flex",
            gap: "14px",
            padding: "16px",
            background: "var(--c-surface)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "14px",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Route size={22} style={{ color: "var(--c-accent-emerald)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "15px", fontWeight: 800, color: "var(--c-text)" }}>{route.title}</strong>
            <p style={{ margin: "4px 0 0", color: "var(--c-muted)", fontSize: "13px", lineHeight: "1.5" }}>{route.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
