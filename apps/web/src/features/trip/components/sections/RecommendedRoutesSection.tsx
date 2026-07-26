import { Route } from "lucide-react";
import type { RecommendedRoute } from "../../../../types/travel";

type RecommendedRoutesSectionProps = {
  routes: RecommendedRoute[];
};

// 여행자가 참고할 추천 루트 목록만 표시한다.
export function RecommendedRoutesSection({ routes }: RecommendedRoutesSectionProps) {
  return (
    <section className="section-block recommended-routes">
      <h2>추천 루트</h2>
      {routes.map((route) => (
        <article className="recommended-route" key={route.id}>
          <Route aria-hidden="true" size={22} />
          <div>
            <strong>{route.title}</strong>
            <p>{route.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
