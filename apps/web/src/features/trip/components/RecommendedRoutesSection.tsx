import { Route } from "lucide-react";
import type { RecommendedRoute } from "../../../types/travel";

type RecommendedRoutesSectionProps = {
  routes: RecommendedRoute[];
};

// 여행자가 참고할 추천 루트 목록만 표시한다.
export function RecommendedRoutesSection({ routes }: RecommendedRoutesSectionProps) {
  return (
    <section className="section-block">
      <h2>추천 루트</h2>
      {routes.map((route) => (
        <article className="list-card" key={route.id}>
          <Route size={22} />
          <div>
            <strong>{route.title}</strong>
            <p>{route.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
