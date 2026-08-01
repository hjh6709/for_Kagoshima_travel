import { Compass } from "lucide-react";
import { useEffect } from "react";
import type { SharedTripResponse } from "../../api/trips";
import { TripPage } from "../trip/TripPage";
import { useSharedTripPageAdapter } from "./useSharedTripPageAdapter";

type SharedTripPageProps = {
  error: string;
  warning: string;
  loading: boolean;
  sharedTrip: SharedTripResponse | null;
};

function SharedTripContent({ sharedTrip, warning }: { sharedTrip: SharedTripResponse; warning: string }) {
  const tripPageProps = useSharedTripPageAdapter(sharedTrip);
  return <TripPage {...tripPageProps} notice={warning} />;
}

export function SharedTripPage({ error, warning, loading, sharedTrip }: SharedTripPageProps) {
  useEffect(() => {
    const existingMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousContent = existingMeta?.content;
    const meta = existingMeta ?? document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    if (!existingMeta) document.head.appendChild(meta);

    return () => {
      if (existingMeta && previousContent !== undefined) {
        existingMeta.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, []);

  if (!loading && !error && sharedTrip) {
    return <SharedTripContent key={sharedTrip.trip.id} sharedTrip={sharedTrip} warning={warning} />;
  }

  return (
    <main className="app-shell">
      <section className="phone-frame shared-frame">
        <div className="content">
          <section className="screen shared-screen">
            <header className="shared-hero">
              <div className="shared-brand-row">
                <span className="shared-brand-mark">
                  <Compass aria-hidden="true" size={19} />
                </span>
                <span>Map Planner 공유 여행</span>
              </div>

              {loading && (
                <div className="shared-load-state" role="status">
                  <span aria-hidden="true" className="shared-loading-mark" />
                  <h1>여행을 불러오는 중입니다</h1>
                  <p>공유된 최신 정보를 확인하고 있습니다.</p>
                </div>
              )}

              {!loading && error && (
                <div className="shared-load-state shared-load-error" role="alert">
                  <h1>공유 여행을 열지 못했습니다</h1>
                  <p>{error}</p>
                  <div>
                    <button className="primary-button" onClick={() => window.location.reload()} type="button">
                      다시 시도
                    </button>
                    <a className="secondary-button" href="/">서비스 홈</a>
                  </div>
                </div>
              )}
            </header>
          </section>
        </div>
      </section>
    </main>
  );
}
